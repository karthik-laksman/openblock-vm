const BlockType = require('openblock-vm/src/extension-support/block-type');
const ArgumentType = require('openblock-vm/src/extension-support/argument-type');
const TargetType = require('openblock-vm/src/extension-support/target-type');
const formatMessage = require('format-message');
const Clone = require('openblock-vm/src/util/clone');
const MathUtil = require('openblock-vm/src/util/math-util');
const Video = require('openblock-vm/src/io/video');
const faceapi = require('face-api.js');

// CRITICAL: Configure face-api.js to use browser environment, not Node.js
// This prevents the "Illegal constructor" error when running in Electron
const { env } = faceapi;
env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
});

const blockIconURI = null;
const menuIconURI = null;

class Scratch3FaceSensingBlock {
    constructor (runtime) {
        this.runtime = runtime;
        this.runtime.emit('EXTENSION_DATA_LOADING', true);

        console.log('Loading face-api.js models...');

        // Use the current origin to avoid CORS issues
        // The static folder should be accessible from the same origin
        const MODEL_URL = window.location.origin + '/models/face-api';
        
        console.log('Model URL:', MODEL_URL);
        
        // Load all necessary models including face recognition
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]).then(() => {
            console.log('Face-api.js models loaded successfully!');
            this.modelsLoaded = true;
            
            // Storage for labeled face descriptors
            this.labeledDescriptors = [];
            
            if (this.runtime.ioDevices) {
                this._loop();
            }
        }).catch(err => {
            console.error('Failed to load face-api.js models:', err);
            console.error('Make sure model files are in: static/models/face-api/');
            console.error('Required files: tiny_face_detector_model-*.bin/json, face_landmark_68_model-*.bin/json');
            this.runtime.emit('EXTENSION_DATA_LOADING', false);
        });

        this.cachedSize = 100;
        this.cachedTilt = 90;

        this.isDetectedArrayLength = 5;
        this.isDetectedArray = new Array(this.isDetectedArrayLength);
        this.isDetectedArray.fill(false, 0, this.isDetectedArrayLength);

        this.smoothedIsDetected = false;
        this._clearAttachments = this._clearAttachments.bind(this);
        this.runtime.on('PROJECT_STOP_ALL', this._clearAttachments);
    }

    async detectFaces(input) {
        if (!this.modelsLoaded) {
            return [];
        }

        try {
            // Convert ImageData to canvas if needed
            let inputElement = input;
            
            if (input instanceof ImageData) {
                // Create a canvas and draw the ImageData onto it
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }
                this._canvas.width = input.width;
                this._canvas.height = input.height;
                const ctx = this._canvas.getContext('2d');
                ctx.putImageData(input, 0, 0);
                inputElement = this._canvas;
            }

            // Use tinyFaceDetector with landmarks and descriptors
            const detections = await faceapi
                .detectAllFaces(inputElement, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224,
                    scoreThreshold: 0.5
                }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections && detections.length > 0) {
                // Convert face-api.js format to BlazeFace-compatible format
                const face = detections[0];
                const box = face.detection.box;
                const landmarks = face.landmarks;
                const descriptor = face.descriptor;

                // Try to match with labeled faces
                let matchedLabel = null;
                if (this.labeledDescriptors.length > 0) {
                    const faceMatcher = new faceapi.FaceMatcher(this.labeledDescriptors, 0.6);
                    const bestMatch = faceMatcher.findBestMatch(descriptor);
                    if (bestMatch.label !== 'unknown') {
                        matchedLabel = bestMatch.label;
                    }
                }

                // Map face-api.js 68 landmarks to BlazeFace 6 landmarks
                const positions = landmarks.positions;
                
                return [{
                    topLeft: [box.x, box.y],
                    bottomRight: [box.x + box.width, box.y + box.height],
                    landmarks: [
                        [positions[36].x, positions[36].y], // left eye center
                        [positions[45].x, positions[45].y], // right eye center
                        [positions[30].x, positions[30].y], // nose tip
                        [positions[62].x, positions[62].y], // mouth center
                        [positions[0].x, positions[0].y],   // left jaw (approximation for ear)
                        [positions[16].x, positions[16].y]  // right jaw (approximation for ear)
                    ],
                    probability: face.detection.score,
                    descriptor: descriptor,
                    identity: matchedLabel
                }];
            }
            
            return [];
        } catch (err) {
            console.error('Error detecting faces:', err);
            return [];
        }
    }

    async learnFace(name) {
        if (!this.currentFace || !this.currentFace.descriptor) {
            console.warn('No face detected to learn');
            return false;
        }

        try {
            const descriptor = this.currentFace.descriptor;
            
            // Check if this person already exists
            const existingIndex = this.labeledDescriptors.findIndex(ld => ld.label === name);
            
            if (existingIndex >= 0) {
                // Add to existing person's descriptors
                this.labeledDescriptors[existingIndex]._descriptors.push(descriptor);
                console.log(`Added new sample for ${name}`);
            } else {
                // Create new labeled descriptor
                const labeledDescriptor = new faceapi.LabeledFaceDescriptors(name, [descriptor]);
                this.labeledDescriptors.push(labeledDescriptor);
                console.log(`Learned new face: ${name}`);
            }
            
            return true;
        } catch (err) {
            console.error('Error learning face:', err);
            return false;
        }
    }

    forgetFace(name) {
        const index = this.labeledDescriptors.findIndex(ld => ld.label === name);
        if (index >= 0) {
            this.labeledDescriptors.splice(index, 1);
            console.log(`Forgot face: ${name}`);
            return true;
        }
        return false;
    }

    forgetAllFaces() {
        this.labeledDescriptors = [];
        console.log('Forgot all faces');
    }

    static get DEFAULT_FACE_SENSING_STATE () {
        return ({
            attachedToPartNumber: null,
            offsetDirection: 0,
            offsetSize: 0,
            offsetX: 0,
            offsetY: 0,
            prevDirection: 0,
            prevSize: 100,
            prevX: 0,
            prevY: 0
        });
    }

    static get DIMENSIONS () {
        return [480, 360];
    }
    
    static get INTERVAL () {
        return 1000 / 15;
    }

    static get STATE_KEY () {
        return 'Scratch.faceSensing';
    }

    get EXTENSION_ID() {
        return 'faceSensing';
    }

    _clearAttachments () {
        this.runtime.targets.forEach(target => {
            const state = this._getFaceSensingState(target);
            state.attachedToPartNumber = null;
        });
    }

    _loop () {
        setTimeout(this._loop.bind(this), Math.max(this.runtime.currentStepTime, Scratch3FaceSensingBlock.INTERVAL));
        
        const frame = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_IMAGE_DATA,
            dimensions: Scratch3FaceSensingBlock.DIMENSIONS,
            cacheTimeout: this.runtime.currentStepTime
        });

        if (frame && this.modelsLoaded) {
            this.detectFaces(frame).then(faces => {
                if (faces && faces.length > 0) {
                    if (!this.firstTime) {
                        this.firstTime = true;
                        this.runtime.emit('EXTENSION_DATA_LOADING', false);
                    }

                    this.currentFace = faces[0];
                    this.updateIsDetected();
                } else {
                    this.currentFace = null;
                    this.updateIsDetected();
                }
            }).catch(err => {
                console.error('Error in face detection loop:', err);
            });
        }
    }

    updateIsDetected () {
        this.isDetectedArray.push(!!this.currentFace);

        if (this.isDetectedArray.length > this.isDetectedArrayLength) {
            this.isDetectedArray.shift();
        }

        if (this.isDetectedArray.every(item => item === false)) {
            this.smoothedIsDetected = false;
        }

        if (this.isDetectedArray.every(item => item === true)) {
            this.smoothedIsDetected = true;
        }
    }
    
    _getFaceSensingState (target) {
        let faceSensingState = target.getCustomState(Scratch3FaceSensingBlock.STATE_KEY);

        if (!faceSensingState) {
            faceSensingState = Clone.simple(Scratch3FaceSensingBlock.DEFAULT_FACE_SENSING_STATE);
            target.setCustomState(Scratch3FaceSensingBlock.STATE_KEY, faceSensingState);
        }

        return faceSensingState;
    }
    
    getInfo () {
        this.runtime.ioDevices.video.enableVideo();

        return [{
            id: 'faceSensing',
            name: formatMessage({
                id: 'faceSensing.categoryName',
                default: 'Face Sensing',
                description: 'Name of face sensing extension'
            }),
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: [{
                opcode: 'goToPart',
                text: formatMessage({
                    id: 'faceSensing.goToPart',
                    default: 'go to [PART]',
                    description: ''
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    PART: {
                        type: ArgumentType.STRING,
                        menu: 'PART',
                        defaultValue: '2'
                    }
                },
                filter: [TargetType.SPRITE]
            }, {
                opcode: 'pointInFaceTiltDirection',
                text: formatMessage({
                    id: 'faceSensing.pointInFaceTiltDirection',
                    default: 'point in direction of face tilt',
                    description: ''
                }),
                blockType: BlockType.COMMAND,
                filter: [TargetType.SPRITE]
            }, {
                opcode: 'setSizeToFaceSize',
                text: formatMessage({
                    id: 'faceSensing.setSizeToFaceSize',
                    default: 'set size to face size',
                    description: ''
                }),
                blockType: BlockType.COMMAND,
                filter: [TargetType.SPRITE]
            }, '---', {
                opcode: 'whenTilted',
                text: formatMessage({
                    id: 'faceSensing.whenTilted',
                    default: 'when face tilts [DIRECTION]',
                    description: ''
                }),
                blockType: BlockType.HAT,
                arguments: {
                    DIRECTION: {
                        type: ArgumentType.STRING,
                        menu: 'TILT',
                        defaultValue: 'left'
                    }
                }
            }, {
                opcode: 'whenSpriteTouchesPart',
                text: formatMessage({
                    id: 'faceSensing.whenSpriteTouchesPart',
                    default: 'when this sprite touches a[PART]',
                    description: ''
                }),
                arguments: {
                    PART: {
                        type: ArgumentType.STRING,
                        menu: 'PART',
                        defaultValue: '2'
                    }
                },
                blockType: BlockType.HAT,
                filter: [TargetType.SPRITE]
            }, {
                opcode: 'whenFaceDetected',
                text: formatMessage({
                    id: 'faceSensing.whenFaceDetected',
                    default: 'when a face is detected',
                    description: ''
                }),
                blockType: BlockType.HAT
            }, '---', {
                opcode: 'faceIsDetected',
                text: formatMessage({
                    id: 'faceSensing.faceDetected',
                    default: 'a face is detected?',
                    description: ''
                }),
                blockType: BlockType.BOOLEAN
            }, {
                opcode: 'faceTilt',
                text: formatMessage({
                    id: 'faceSensing.faceTilt',
                    default: 'face tilt',
                    description: ''
                }),
                blockType: BlockType.REPORTER
            }, {
                opcode: 'faceSize',
                text: formatMessage({
                    id: 'faceSensing.faceSize',
                    default: 'face size',
                    description: ''
                }),
                blockType: BlockType.REPORTER
            }, '---', {
                opcode: 'learnFaceWithName',
                text: formatMessage({
                    id: 'faceSensing.learnFaceWithName',
                    default: 'learn current face as [NAME]',
                    description: ''
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: 'person1'
                    }
                }
            }, {
                opcode: 'forgetFaceWithName',
                text: formatMessage({
                    id: 'faceSensing.forgetFaceWithName',
                    default: 'forget face named [NAME]',
                    description: ''
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: 'person1'
                    }
                }
            }, {
                opcode: 'forgetAllFaces',
                text: formatMessage({
                    id: 'faceSensing.forgetAllFaces',
                    default: 'forget all faces',
                    description: ''
                }),
                blockType: BlockType.COMMAND
            }, {
                opcode: 'recognizedFaceName',
                text: formatMessage({
                    id: 'faceSensing.recognizedFaceName',
                    default: 'recognized face name',
                    description: ''
                }),
                blockType: BlockType.REPORTER
            }, {
                opcode: 'isFaceRecognized',
                text: formatMessage({
                    id: 'faceSensing.isFaceRecognized',
                    default: 'is face recognized?',
                    description: ''
                }),
                blockType: BlockType.BOOLEAN
            }, {
                opcode: 'isFaceNamed',
                text: formatMessage({
                    id: 'faceSensing.isFaceNamed',
                    default: 'is face named [NAME]?',
                    description: ''
                }),
                blockType: BlockType.BOOLEAN,
                arguments: {
                    NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: 'person1'
                    }
                }
            }],
            menus: {
                PART: [{
                    text: 'nose',
                    value: '2'
                }, {
                    text: 'mouth',
                    value: '3'
                }, {
                    text: 'left eye',
                    value: '0'
                }, {
                    text: 'right eye',
                    value: '1'
                }, {
                    text: 'between eyes',
                    value: '6'
                }, {
                    text: 'left ear',
                    value: '4'
                }, {
                    text: 'right ear',
                    value: '5'
                }, {
                    text: 'top of head',
                    value: '7'
                }],
                TILT: [{
                    text: 'left',
                    value: 'left'
                }, {
                    text: 'right',
                    value: 'right'
                }]
            }
        }];
    }
    
    getBetweenEyesPosition () {
        const leftEye = this.getPartPosition(0);
        const rightEye = this.getPartPosition(1);
        return {
            x: leftEye.x + (rightEye.x - leftEye.x) / 2,
            y: leftEye.y + (rightEye.y - leftEye.y) / 2
        };
    }
    
    getTopOfHeadPosition () {
        const leftEyePos = this.getPartPosition(0);
        const rightEyePos = this.getPartPosition(1);
        const mouthPos = this.getPartPosition(3);
        const dx = rightEyePos.x - leftEyePos.x;
        const dy = rightEyePos.y - leftEyePos.y;
        const directionRads = Math.atan2(dy, dx) + Math.PI / 2;
        const betweenEyesPos = this.getBetweenEyesPosition();
        const mouthDistance = this.distance(betweenEyesPos, mouthPos);
        return {
            x: betweenEyesPos.x + mouthDistance * Math.cos(directionRads),
            y: betweenEyesPos.y + mouthDistance * Math.sin(directionRads)
        };
    }
    
    distance (pointA, pointB) {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    whenSpriteTouchesPart (args, util) {
        if (!this.currentFace) return false;
        if (!this.currentFace.landmarks) return false;
        
        const pos = this.getPartPosition(args.PART);
        
        // Check if the sprite's bounding box intersects with the face part position
        const target = util.target;
        const bounds = target.getBounds();
        
        if (!bounds) return false;
        
        // Check if the point is within the sprite's bounding box
        return (
            pos.x >= bounds.left &&
            pos.x <= bounds.right &&
            pos.y >= bounds.bottom &&
            pos.y <= bounds.top
        );
    }

    whenFaceDetected () {
        return this.smoothedIsDetected;
    }

    faceIsDetected () {
        return this.smoothedIsDetected;
    }

    faceSize () {
        if (!this.currentFace) return this.cachedSize;
        const size = Math.round(this.currentFace.bottomRight[0] - this.currentFace.topLeft[0]);
        this.cachedSize = size;
        return size;
    }

    getPartPosition (part) {
        const defaultPos = { x: 0, y: 0 };
        if (!this.currentFace) return defaultPos;
        if (!this.currentFace.landmarks) return defaultPos;

        if (Number(part) === 6) {
            return this.getBetweenEyesPosition();
        }

        if (Number(part) === 7) {
            return this.getTopOfHeadPosition();
        }

        const result = this.currentFace.landmarks[Number(part)];
        if (result) {
            return this.toScratchCoords(result);
        }

        return defaultPos;
    }

    toScratchCoords (position) {
        return {
            x: position[0] - 240,
            y: 180 - position[1]
        };
    }

    whenTilted (args) {
        const TILT_THRESHOLD = 10;
        if (args.DIRECTION === 'left') {
            return this.faceTilt() < 90 - TILT_THRESHOLD;
        }
        if (args.DIRECTION === 'right') {
            return this.faceTilt() > 90 + TILT_THRESHOLD;
        }
        return false;
    }

    goToPart (args, util) {
        if (!this.currentFace) return;
        const pos = this.getPartPosition(args.PART);
        util.target.setXY(pos.x, pos.y);
    }

    pointInFaceTiltDirection (args, util) {
        if (!this.currentFace) return;
        util.target.setDirection(this.faceTilt());
    }

    setSizeToFaceSize (args, util) {
        if (!this.currentFace) return;
        util.target.setSize(this.faceSize());
    }

    faceTilt () {
        if (!this.currentFace) return this.cachedTilt;
        const leftEyePos = this.getPartPosition(0);
        const rightEyePos = this.getPartPosition(1);
        const dx = rightEyePos.x - leftEyePos.x;
        const dy = rightEyePos.y - leftEyePos.y;
        const direction = 90 - MathUtil.radToDeg(Math.atan2(dy, dx));
        const tilt = Math.round(direction);
        this.cachedTilt = tilt;
        return tilt;
    }

    // Face recognition block handlers
    learnFaceWithName (args) {
        const name = String(args.NAME || '').trim();
        if (!name) {
            console.warn('Please provide a name to learn the face');
            return;
        }
        this.learnFace(name);
    }

    forgetFaceWithName (args) {
        const name = String(args.NAME || '').trim();
        if (!name) return;
        this.forgetFace(name);
    }

    forgetAllFaces () {
        this.forgetAllFaces();
    }

    recognizedFaceName () {
        if (!this.currentFace) return '';
        return this.currentFace.identity || '';
    }

    isFaceRecognized () {
        if (!this.currentFace) return false;
        return !!(this.currentFace.identity);
    }

    isFaceNamed (args) {
        const name = String(args.NAME || '').trim();
        if (!name || !this.currentFace) return false;
        return this.currentFace.identity === name;
    }
}

module.exports = Scratch3FaceSensingBlock;