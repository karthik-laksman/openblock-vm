const BlockType = require('openblock-vm/src/extension-support/block-type');
const ArgumentType = require('openblock-vm/src/extension-support/argument-type');
const formatMessage = require('format-message');
const Video = require('openblock-vm/src/io/video');
const faceapi = require('face-api.js');



// Configure face-api.js to use browser environment
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

class Scratch3facedetectionBlocks {
    constructor (runtime) {
        this.runtime = runtime;
        this.runtime.emit('EXTENSION_DATA_LOADING', true);

        console.log('Loading face recognition models...');
         

        const MODEL_URL = window.location.origin + '/models/face-api';
        
        // Load all models including expressions
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]).then(() => {
            console.log('All face recognition models loaded!');
            this.modelsLoaded = true;
            this.runtime.emit('EXTENSION_DATA_LOADING', false);
        }).catch(err => {
            console.error('Failed to load models:', err);
            this.runtime.emit('EXTENSION_DATA_LOADING', false);
        });

        // Settings
        this.videoVisible = true;
        this.boundingBoxVisible = true;
        this.detectionThreshold = 0.5;
        this.isDetecting = false;

        // Detection data
        this.detectedFaces = [];
        this.labeledDescriptors = [];
        this.faceClasses = {}; // Map face ID to class name

        // Canvas for drawing bounding boxes
        this.overlayCanvas = null;

        this.trackedFaces = [];
        this.nextFaceId = 1;

        // tuning
        this.faceMatchThreshold = 0.6;
        this.faceTimeoutMs = 3000; // 2 seconds

        this.isDetecting = false;
        this.video = null;
        
        // bounding box tuning
        this.boxScale = 0.85;
        this.boxOffsetX = 10;
        this.boxOffsetY = 0;

    }

    static get STATE_KEY () {
        return 'Scratch.facedetection';
    }

    get EXTENSION_ID () {
        return 'facedetection';
    }

    getInfo () {
       // this.runtime.ioDevices.video.enableVideo();

        return [{
            id: 'facedetection',
            name: formatMessage({
                id: 'facedetection.categoryName',
                default: 'Face detection',
                description: 'Face recognition and expression detection'
            }),
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: [
                {
                    opcode: 'setVideoVisible',
                    text: formatMessage({
                        id: 'facedetection.setVideoVisible',
                        default: 'set video visible [VISIBLE]',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VISIBLE: {
                            type: ArgumentType.STRING,
                            menu: 'VISIBLE_OPTIONS',
                            defaultValue: 'on'
                        }
                    }
                },
                {
                    opcode: 'setBoundingBoxVisible',
                    text: formatMessage({
                        id: 'facedetection.setBoundingBoxVisible',
                        default: 'set bounding box visible [VISIBLE]',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VISIBLE: {
                            type: ArgumentType.STRING,
                            menu: 'VISIBLE_OPTIONS',
                            defaultValue: 'on'
                        }
                    }
                },
                {
                    opcode: 'setDetectionThreshold',
                    text: formatMessage({
                        id: 'facedetection.setDetectionThreshold',
                        default: 'set detection threshold to [THRESHOLD]',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        THRESHOLD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.5
                        }
                    }
                },
                '---',
                {
                    opcode: 'startDetection',
                    text: formatMessage({
                        id: 'facedetection.startDetection',
                        default: 'start face detection',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'stopDetection',
                    text: formatMessage({
                        id: 'facedetection.stopDetection',
                        default: 'stop face detection',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'faceCount',
                    text: formatMessage({
                        id: 'facedetection.faceCount',
                        default: 'face count',
                        description: ''
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'isFaceDetected',
                    text: formatMessage({
                        id: 'facedetection.isFaceDetected',
                        default: 'is face [FACE_ID] detected?',
                        description: ''
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                '---',
                {
                    opcode: 'addFaceClass',
                    text: formatMessage({
                        id: 'facedetection.addFaceClass',
                        default: 'add class of face [FACE_ID] as [NAME]',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'person1'
                        }
                    }
                },
                {
                    opcode: 'getFaceClass',
                    text: formatMessage({
                        id: 'facedetection.getFaceClass',
                        default: 'class of face [FACE_ID]',
                        description: ''
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'resetFaceClasses',
                    text: formatMessage({
                        id: 'facedetection.resetFaceClasses',
                        default: 'reset face classes',
                        description: ''
                    }),
                    blockType: BlockType.COMMAND
                },
                '---',
               {
                    opcode: 'getFaceExpression',
                    text: formatMessage({
                        id: 'facedetection.getFaceExpression',
                        default: 'expression of face [FACE_ID]',
                        description: ''
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'isFaceExpression',
                    text: formatMessage({
                        id: 'facedetection.isFaceExpression',
                        default: 'is face [FACE_ID] expression [EXPRESSION]?',
                        description: ''
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        EXPRESSION: {
                            type: ArgumentType.STRING,
                            menu: 'EXPRESSIONS',
                            defaultValue: 'happy'
                        }
                    }
                },
                {
                    opcode: 'getFaceExpressionConfidence',
                    text: formatMessage({
                        id: 'facedetection.getFaceExpressionConfidence',
                        default: '[EXPRESSION] confidence of face [FACE_ID]',
                        description: ''
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        FACE_ID: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        EXPRESSION: {
                            type: ArgumentType.STRING,
                            menu: 'EXPRESSIONS',
                            defaultValue: 'happy'
                        }
                    }
                }
            ],
            menus: {
                VISIBLE_OPTIONS: [{
                    text: 'on',
                    value: 'on'
                }, {
                    text: 'off',
                    value: 'off'
                }],
                EXPRESSIONS: [
                    { text: 'happy', value: 'happy' },
                    { text: 'sad', value: 'sad' },
                    { text: 'angry', value: 'angry' },
                    { text: 'surprised', value: 'surprised' },
                    { text: 'disgusted', value: 'disgusted' },
                    { text: 'fearful', value: 'fearful' },
                    { text: 'neutral', value: 'neutral' }
                ]
            }
        }];
    }


matchTrackedFace(detection, now) {
    let bestMatch = null;
    let bestScore = Infinity;

    for (const face of this.trackedFaces) {

        // 1️⃣ Hard lock — DO NOT change ID
        if (face.lockedUntil && now < face.lockedUntil) {
            return face;
        }

        // 2️⃣ Descriptor distance
        const descDist = faceapi.euclideanDistance(
            detection.descriptor,
            face.descriptor
        );

        // 3️⃣ Box center distance
        const dx = (face.box.x + face.box.width / 2) -
                   (detection.detection.box.x + detection.detection.box.width / 2);
        const dy = (face.box.y + face.box.height / 2) -
                   (detection.detection.box.y + detection.detection.box.height / 2);

        const boxDist = Math.sqrt(dx * dx + dy * dy);

        // Combined score (tunable)
        const score = descDist * 0.7 + (boxDist / 100) * 0.3;

        if (score < bestScore && descDist < this.faceMatchThreshold) {
            bestScore = score;
            bestMatch = face;
        }
    }

    return bestMatch;
}



addFaceClass(args) {
    const faceId = Number(args.FACE_ID);
    const name = String(args.NAME || '').trim();

    if (!name) return;

    const face = this.trackedFaces.find(f => f.id === faceId);
    if (!face) return;

    face.name = name;
    console.log(`Face ${faceId} named as ${name}`);
}



    async detectFaces(input) {
        if (!this.modelsLoaded || !this.isDetecting) {
            return [];
        }

        try {
            // Convert ImageData to canvas if needed
            let inputElement = input;
            
            if (input instanceof ImageData) {
                if (!this._canvas) {
                    this._canvas = document.createElement('canvas');
                }
                this._canvas.width = input.width;
                this._canvas.height = input.height;
                const ctx = this._canvas.getContext('2d');
                ctx.putImageData(input, 0, 0);
                inputElement = this._canvas;
            }

            // Detect faces with landmarks, descriptors, and expressions
            const detections = await faceapi
                .detectAllFaces(inputElement, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224,
                    scoreThreshold: this.detectionThreshold
                }))
                .withFaceLandmarks()
                .withFaceDescriptors()
                .withFaceExpressions();

            return detections;
        } catch (err) {
            console.error('Error detecting faces:', err);
            return [];
        }
    }

   _loop () {
    if (!this.isDetecting) return;

    setTimeout(() => this._loop(), 100); // ~10 FPS

    const frame = this.runtime.ioDevices.video.getFrame({
        format: Video.FORMAT_IMAGE_DATA,
        dimensions: [480, 360],
        cacheTimeout: 100
    });

    if (!frame) return;

    this.detectFaces(frame).then(detections => {
        const now = Date.now();
        const updatedTrackedFaces = [];

        // --- Match detections to existing tracked faces ---
        detections.forEach(detection => {
            let trackedFace = this.matchTrackedFace(detection);

            if (trackedFace) {
                // Update existing face
                trackedFace.descriptor = detection.descriptor;
                trackedFace.box = detection.detection.box;
                trackedFace.expressions = detection.expressions;
                trackedFace.lastSeen = now;
                

                updatedTrackedFaces.push(trackedFace);
            } else {
                // New face → assign new stable ID
                updatedTrackedFaces.push({
                    id: this.nextFaceId++,
                    descriptor: detection.descriptor,
                    box: detection.detection.box,
                    expressions: detection.expressions,
                    lastSeen: now,
                    name: null
                });
            }
        });

        // --- Keep old faces for a short time even if not detected ---
        this.trackedFaces.forEach(face => {
            if (
                !updatedTrackedFaces.find(f => f.id === face.id) &&
                now - face.lastSeen < this.faceTimeoutMs
            ) {
                updatedTrackedFaces.push(face);
            }
        });

        // --- Remove expired faces ---
        this.trackedFaces = updatedTrackedFaces.filter(
            face => now - face.lastSeen < this.faceTimeoutMs
        );

        // --- Draw bounding boxes using STABLE IDs ---
        if (this.boundingBoxVisible) {
            this.drawBoundingBoxes(this.trackedFaces);
        } else if (this.overlayCanvas) {
            const ctx = this.overlayCanvas.getContext('2d');
            ctx.clearRect(0, 0, 480, 360);
        }
    }).catch(err => {
        console.error('Face tracking loop error:', err);
    });
}

    createOverlayCanvas() {
    if (this.overlayCanvas) return;

    const stage = document.querySelector('.stage_stage_1fD7k')
        || document.querySelector('[class*="stage"]');

    if (!stage) {
        console.warn('Stage not found');
        return;
    }

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = 480;
    this.overlayCanvas.height = 360;

    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '999';

    stage.style.position = 'relative';
    stage.appendChild(this.overlayCanvas);
}



 drawBoundingBoxes(trackedFaces) {
    this.createOverlayCanvas();
    if (!this.overlayCanvas) return;

    const ctx = this.overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, 480, 360);

    trackedFaces.forEach(face => {
        const box = face.box;
        if (!box) return;

        // ---- scale box ----
        const bw = box.width * this.boxScale;
        const bh = box.height * this.boxScale;

        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;

        let x = cx - bw / 2 + this.boxOffsetX;
        let y = cy - bh / 2 + this.boxOffsetY;

        // ---- expression ----
       let expression = 'neutral';
        if (face.expressions.asSortedArray) {
            expression = face.expressions.asSortedArray()[0].expression || 'neutral';
        }

        // ---- label ----
        const name = face.name || `Face ${face.id}`;
        const label = `${name} | ${expression}`;

        // ---- color ----
        const color = face.name ? '#00ff00' : '#ff0000';

        // ---- draw box ----
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, bw, bh);

        // ---- label background ----
        ctx.font = '14px Arial';
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = color;
        ctx.fillRect(x, y - 20, textWidth + 6, 18);

        // ---- label text ----
        ctx.fillStyle = '#000000';
        ctx.fillText(label, x + 3, y - 6);
    });
}




    // Block implementations
    setVideoVisible(args) {
     /*   this.videoVisible = args.VISIBLE === 'on';
        const videoElement = this.runtime.ioDevices.video.provider.video;
        if (videoElement) {
            videoElement.style.visibility = this.videoVisible ? 'visible' : 'hidden';
        }*/

    const turnOn = args.VISIBLE === 'on';
    const videoDevice = this.runtime.ioDevices.video;

    if (turnOn) {
        this.runtime.ioDevices.video.enableVideo();
       
    } else {
       
        videoDevice.disableVideo();
        this.stopDetection();
    }
    }

    setBoundingBoxVisible(args) {
        this.boundingBoxVisible = args.VISIBLE === 'on';
        if (!this.boundingBoxVisible && this.overlayCanvas) {
            const ctx = this.overlayCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
    }

    setDetectionThreshold(args) {
        this.detectionThreshold = Math.max(0, Math.min(1, Number(args.THRESHOLD)));
    }

    startDetection() {
        if (!this.isDetecting) {
            this.isDetecting = true;
            this._loop();
        }
    }

stopDetection() {
    this.isDetecting = false;
    this.trackedFaces = [];

    if (this.overlayCanvas) {
        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, 480, 360);
    }
}


faceCount() {
    return this.trackedFaces.length;
}

isFaceDetected(args) {
    const faceId = Number(args.FACE_ID);
    return this.trackedFaces.some(f => f.id === faceId);
}
addFaceClass(args) {
    const faceId = Number(args.FACE_ID);
    const name = String(args.NAME || '').trim();

    if (!name) return;

    const face = this.trackedFaces.find(f => f.id === faceId);
    if (!face) return;

    face.name = name;
    console.log(`Face ${faceId} named as ${name}`);
}


getFaceClass(args) {
    const faceId = Number(args.FACE_ID);
    const face = this.trackedFaces.find(f => f.id === faceId);
    return face.name || '';
}

clearAllFaces(immediate) {
    if (immediate) {
        // Remove everything instantly
        this.trackedFaces = [];
    } else {
        // Mark faces as expired (TTL will remove them)
        const now = Date.now();
        this.trackedFaces.forEach(face => {
            face.lastSeen = now - this.faceTimeoutMs - 1;
        });
    }

    // Reset ID counter
    this.nextFaceId = 1;

    // Clear bounding boxes
    if (this.overlayCanvas) {
        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, 480, 360);
    }
}



resetFaceClasses() {
    // Reset names + IDs + boxes
    this.clearAllFaces(true);
    console.log('Reset face classes and face IDs');
}


    getFaceExpression(args) {
        const faceId = Number(args.FACE_ID);
        
        if (faceId > 0 && faceId <= this.detectedFaces.length) {
            const detection = this.detectedFaces[faceId - 1];
            const expressions = detection.expressions.asSortedArray();
            return expressions[0].expression;
        }
        
        return '';
    }

    isFaceExpression(args) {
        const faceId = Number(args.FACE_ID);
        const expression = String(args.EXPRESSION || '').toLowerCase();
        
        if (faceId > 0 && faceId <= this.detectedFaces.length) {
            const detection = this.detectedFaces[faceId - 1];
            const expressions = detection.expressions.asSortedArray();
            return expressions[0].expression === expression;
        }
        
        return false;
    }

    getFaceExpressionConfidence(args) {
        const faceId = Number(args.FACE_ID);
        const expression = String(args.EXPRESSION || '').toLowerCase();
        
        if (faceId > 0 && faceId <= this.detectedFaces.length) {
            const detection = this.detectedFaces[faceId - 1];
            const value = detection.expressions[expression];
            return value ? Math.round(value * 100) : 0;
        }
        
        return 0;
    }
}

module.exports = Scratch3facedetectionBlocks;