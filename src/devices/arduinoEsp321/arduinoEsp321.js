const formatMessage = require('format-message');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const ProgramModeType = require('../../extension-support/program-mode-type');

const CommonPeripheral = require('../common/common-peripheral');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
//const blockIconURI = 'static/blockicons/fable-illustration-small.svg';

/**
 * The list of USB device filters.
 * @readonly
 */
const PNPID_LIST = [
    // CH340
    'USB\\VID_1A86&PID_7523',
    // CH9102
    'USB\\VID_1A86&PID_55D4',
    // CP2102
    'USB\\VID_10C4&PID_EA60'
];

/**
 * Configuration of serialport
 * @readonly
 */
const SERIAL_CONFIG = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1
};

/**
 * Configuration for arduino-cli.
 * @readonly
 */
const DIVECE_OPT = {
    type: 'arduino',
    fqbn: {
        darwin: 'esp32:esp32:esp32:UploadSpeed=460800',
        linux: 'esp32:esp32:esp32:UploadSpeed=460800',
        win32: 'esp32:esp32:esp32:UploadSpeed=921600'
    },
    firmware: 'test6.ino.bin'
};

const Pins = {
    IO0: '0',
    IO1: '1',
    IO2: '2',
    IO3: '3',
    IO4: '4',
    IO5: '5',
    IO6: '6',
    IO7: '7',
    IO8: '8',
    IO9: '9',
    IO10: '10',
    IO11: '11',
    IO12: '12',
    IO13: '13',
    IO14: '14',
    IO15: '15',
    IO16: '16',
    IO17: '17',
    IO18: '18',
    IO19: '19',
    IO21: '21',
    IO22: '22',
    IO23: '23',
    IO25: '25',
    IO26: '26',
    IO27: '27',
    IO32: '32',
    IO33: '33',
    IO34: '34',
    IO35: '35',
    IO36: '36',
    IO39: '39'
};

const Level = {
    High: 'HIGH',
    Low: 'LOW'
};

const Channels = {
    CH0: '0',
    CH1: '1',
    CH2: '2',
    CH3: '3',
    CH4: '4',
    CH5: '5',
    CH6: '6',
    CH7: '7',
    CH8: '8',
    CH9: '9',
    CH10: '10',
    CH11: '11',
    CH12: '12',
    CH13: '13',
    CH14: '14',
    CH15: '15'
};

const SerialNo = {
    Serial0: '0',
    Serial1: '1',
    Serial2: '2'
};

const Buadrate = {
    B4800: '4800',
    B9600: '9600',
    B19200: '19200',
    B38400: '38400',
    B57600: '57600',
    B76800: '76800',
    B115200: '115200'
};

const Eol = {
    Warp: 'warp',
    NoWarp: 'noWarp'
};

const Mode = {
    Input: 'INPUT',
    Output: 'OUTPUT',
    InputPullup: 'INPUT_PULLUP',
    InputPulldown: 'INPUT_PULLDOWN'
};

const InterrupMode = {
    Rising: 'RISING',
    Falling: 'FALLING',
    Change: 'CHANGE',
    LowLevel: 'LOW',
    HighLevel: 'HIGH'
};

const DataType = {
    Integer: 'INTEGER',
    Decimal: 'DECIMAL',
    String: 'STRING'
};
const LedState = {
    On: '1',
    Off: '0'
        };

/**
 * Manage communication with a Arduino esp32 peripheral over a OpenBlock Link client socket.
 */
class ArduinoEsp321 extends CommonPeripheral{
    /**
     * Construct a Arduino communication object.
     * @param {Runtime} runtime - the OpenBlock runtime
     * @param {string} deviceId - the id of the extension
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, deviceId, originalDeviceId,) {
        super(runtime, deviceId, originalDeviceId, PNPID_LIST, SERIAL_CONFIG, DIVECE_OPT);

    }
} 

/**
 * OpenBlock blocks to interact with a Arduino esp32 peripheral.
 */
class OpenBlockArduinoEsp321Device {
    /**
     * @return {string} - the ID of this extension.
     */
    get DEVICE_ID () {
        return 'arduinoEsp321';
    }

    get PINS_MENU () {
        return [
            {
                text: 'IO0',
                value: Pins.IO0
            },
            {
                text: 'IO1',
                value: Pins.IO1
            },
            {
                text: 'IO2',
                value: Pins.IO2
            },
            {
                text: 'IO3',
                value: Pins.IO3
            },
            {
                text: 'IO4',
                value: Pins.IO4
            },
            {
                text: 'IO5',
                value: Pins.IO5
            },
            // Pins 6 to 11 are used by the ESP32 Flash, not recommended for general use.
            // {
            //     text: 'IO6',
            //     value: Pins.IO6
            // },
            // {
            //     text: 'IO7',
            //     value: Pins.IO7
            // },
            // {
            //     text: 'IO8',
            //     value: Pins.IO8
            // },
            // {
            //     text: 'IO9',
            //     value: Pins.IO9
            // },
            // {
            //     text: 'IO10',
            //     value: Pins.IO10
            // },
            // {
            //     text: 'IO11',
            //     value: Pins.IO11
            // },
            {
                text: 'IO12',
                value: Pins.IO12
            },
            {
                text: 'IO13',
                value: Pins.IO13
            },
            {
                text: 'IO14',
                value: Pins.IO14
            },
            {
                text: 'IO15',
                value: Pins.IO15
            },
            {
                text: 'IO16',
                value: Pins.IO16
            },
            {
                text: 'IO17',
                value: Pins.IO17
            },
            {
                text: 'IO18',
                value: Pins.IO18
            },
            {
                text: 'IO19',
                value: Pins.IO19
            },
            {
                text: 'IO21',
                value: Pins.IO21
            },
            {
                text: 'IO22',
                value: Pins.IO22
            },
            {
                text: 'IO23',
                value: Pins.IO23
            },
            {
                text: 'IO25',
                value: Pins.IO25
            },
            {
                text: 'IO26',
                value: Pins.IO26
            },
            {
                text: 'IO27',
                value: Pins.IO27
            },
            {
                text: 'IO32',
                value: Pins.IO32
            },
            {
                text: 'IO33',
                value: Pins.IO33
            },
            {
                text: 'IO34',
                value: Pins.IO34
            },
            {
                text: 'IO35',
                value: Pins.IO35
            },
            {
                text: 'IO36',
                value: Pins.IO36
            },
            {
                text: 'IO39',
                value: Pins.IO39
            }
        ];
    }

    get OUT_PINS_MENU () {
        return [
            {
                text: 'IO0',
                value: Pins.IO0
            },
            {
                text: 'IO1',
                value: Pins.IO1
            },
            {
                text: 'IO2',
                value: Pins.IO2
            },
            {
                text: 'IO3',
                value: Pins.IO3
            },
            {
                text: 'IO4',
                value: Pins.IO4
            },
            {
                text: 'IO5',
                value: Pins.IO5
            },
            // Pins 6 to 11 are used by the ESP32 Flash, not recommended for general use.
            // {
            //     text: 'IO6',
            //     value: Pins.IO6
            // },
            // {
            //     text: 'IO7',
            //     value: Pins.IO7
            // },
            // {
            //     text: 'IO8',
            //     value: Pins.IO8
            // },
            // {
            //     text: 'IO9',
            //     value: Pins.IO9
            // },
            // {
            //     text: 'IO10',
            //     value: Pins.IO10
            // },
            // {
            //     text: 'IO11',
            //     value: Pins.IO11
            // },
            {
                text: 'IO12',
                value: Pins.IO12
            },
            {
                text: 'IO13',
                value: Pins.IO13
            },
            {
                text: 'IO14',
                value: Pins.IO14
            },
            {
                text: 'IO15',
                value: Pins.IO15
            },
            {
                text: 'IO16',
                value: Pins.IO16
            },
            {
                text: 'IO17',
                value: Pins.IO17
            },
            {
                text: 'IO18',
                value: Pins.IO18
            },
            {
                text: 'IO19',
                value: Pins.IO19
            },
            {
                text: 'IO21',
                value: Pins.IO21
            },
            {
                text: 'IO22',
                value: Pins.IO22
            },
            {
                text: 'IO23',
                value: Pins.IO23
            },
            {
                text: 'IO25',
                value: Pins.IO25
            },
            {
                text: 'IO26',
                value: Pins.IO26
            },
            {
                text: 'IO27',
                value: Pins.IO27
            },
            {
                text: 'IO32',
                value: Pins.IO32
            },
            {
                text: 'IO33',
                value: Pins.IO33
            },
            
        ];
    }

    get MODE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'arduinoEsp32.modeMenu.input',
                    default: 'input',
                    description: 'label for input pin mode'
                }),
                value: Mode.Input
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.modeMenu.output',
                    default: 'output',
                    description: 'label for output pin mode'
                }),
                value: Mode.Output
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.modeMenu.inputPullup',
                    default: 'input-pullup',
                    description: 'label for input-pullup pin mode'
                }),
                value: Mode.InputPullup
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.modeMenu.inputPulldown',
                    default: 'input-pulldown',
                    description: 'label for input-pulldown pin mode'
                }),
                value: Mode.InputPulldown
            }
        ];
    }

    get ANALOG_PINS_MENU () {
        return [
            {
                text: 'IO0',
                value: Pins.IO0
            },
            {
                text: 'IO2',
                value: Pins.IO2
            },
            {
                text: 'IO4',
                value: Pins.IO4
            },
            {
                text: 'IO12',
                value: Pins.IO12
            },
            {
                text: 'IO13',
                value: Pins.IO13
            },
            {
                text: 'IO14',
                value: Pins.IO14
            },
            {
                text: 'IO15',
                value: Pins.IO15
            },
            {
                text: 'IO25',
                value: Pins.IO25
            },
            {
                text: 'IO26',
                value: Pins.IO26
            },
            {
                text: 'IO27',
                value: Pins.IO27
            },
            {
                text: 'IO32',
                value: Pins.IO32
            },
            {
                text: 'IO33',
                value: Pins.IO33
            },
            {
                text: 'IO34',
                value: Pins.IO34
            },
            {
                text: 'IO35',
                value: Pins.IO35
            },
            {
                text: 'IO36',
                value: Pins.IO36
            },
            {
                text: 'IO39',
                value: Pins.IO39
            }
        ];
    }



    get LEVEL_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'arduinoEsp32.levelMenu.high',
                    default: 'high',
                    description: 'label for high level'
                }),
                value: Level.High
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.levelMenu.low',
                    default: 'low',
                    description: 'label for low level'
                }),
                value: Level.Low
            }
        ];
    }

    get LEDC_CHANNELS_MENU () {
        return [
            {
                text: 'CH0 (LT0)',
                value: Channels.CH0
            },
            {
                text: 'CH1 (LT0)',
                value: Channels.CH1
            },
            {
                text: 'CH2 (LT1)',
                value: Channels.CH2
            },
            {
                text: 'CH3 (LT1)',
                value: Channels.CH3
            },
            {
                text: 'CH4 (LT2)',
                value: Channels.CH4
            },
            {
                text: 'CH5 (LT2)',
                value: Channels.CH5
            },
            {
                text: 'CH6 (LT3)',
                value: Channels.CH6
            },
            {
                text: 'CH7 (LT3)',
                value: Channels.CH7
            },
            {
                text: 'CH8 (HT0)',
                value: Channels.CH8
            },
            {
                text: 'CH9 (HT0)',
                value: Channels.CH9
            },
            {
                text: 'CH10 (HT1)',
                value: Channels.CH10
            },
            {
                text: 'CH11 (HT1)',
                value: Channels.CH11
            },
            {
                text: 'CH12 (HT2)',
                value: Channels.CH12
            },
            {
                text: 'CH13 (HT2)',
                value: Channels.CH13
            },
            {
                text: 'CH14 (HT3)',
                value: Channels.CH14
            },
            {
                text: 'CH15 (HT3)',
                value: Channels.CH15
            }
        ];
    }

    get DAC_PINS_MENU () {
        return [
            {
                text: 'IO25',
                value: Pins.IO25
            },
            {
                text: 'IO26',
                value: Pins.IO26
            }
        ];
    }

    get TOUCH_PINS_MENU () {
        return [
            {
                text: 'Touch pin 1',
                value: Pins.IO15
            },
            {
                text: 'Touch pin 2',
                value: Pins.IO4
            }

        ];
    }

        get SENSOR_PINS_MENU () {
        return [
            {
                text: 'Sensor 1',
                value: '1'
            },
            {
                text: 'Sensor 2',
                value: '2'
            },
            {
                text: 'Sensor 3',
                value: '3'
            },

        ];
    }

        get SERVO_PINS_MENU () {
        return [
            {
                text: 'Servo 1',
                value: Pins.IO2
            },
            {
                text: 'Servo 2',
                value: Pins.IO33
            },
        ];
    }

        get SWITCH_PINS_MENU () {
        return [
            {
                text: 'Switch left',
                value: Pins.IO36
            },
            {
                text: 'Switch right',
                value: Pins.IO39
            },
        ];
    }

        get BUZZER_PINS_MENU () {
        return [
            {
                text: 'beep on',
                value: 'beepon()'
            },
            {
                text: 'beep off',
                value: 'beepoff()'
            },
            {
                text: 'play music 1',
                value: 'play_music_1()'
            },
                        {
                text: 'play music 2',
                value: 'play_music_2()'
            },
                        {
                text: 'play music 3',
                value: 'play_music_3()'
            }

        ];
    }

    
    get FABLE_PINS_MENU () {
        return [
            {
                text: 'Forward',
                value: 'F'
                //value: 'fable_forward()'
            },
            {
                text: 'Reverse',
               // value: 'fable_reverse()'
               value: 'B'
            },
                        {
                text: 'Right',
               // value: 'fable_right()'
               value: 'R'
            },
                        {
                text: 'Left',
               // value: 'fable_left()'
               value: 'L'
            },
            {
                text: 'Stop',
               // value: 'fable_stop()'
               value: 'S'
            }

        ];
    }
        get RIGHTMOTOR_PINS_MENU () {
        return [
            {
                text: 'Forward',
                value: 'M1forward()'
            },
            {
                text: 'Reverse',
                value: 'M1reverse()'
            },
            {
                text: 'Stop',
                value: 'M1stop()'
            },

        ];
    }
            get LEFTMOTOR_PINS_MENU () {
        return [
            {
                text: 'Forward',
                value: 'M2forward()'
            },
            {
                text: 'Reverse',
                value: 'M2reverse()'
            },
            {
                text: 'Stop',
                value: 'M2stop()'
            },

        ];
     }
        get LEDSTATE_MENU () {
            return [
                {
                    text: formatMessage({
                        id: 'arduinoEsp321.ledState.on',
                        default: 'on',
                        description: 'label for led state on'
                    }),
                    value: LedState.On
                },
                {
                    text: formatMessage({
                        id: 'arduinoEsp321.ledState.off',
                        default: 'off',
                        description: 'label for led state off'
                    }),
                    value: LedState.Off
                }
            ];
        }



    get INTERRUP_MODE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'arduinoEsp32.InterrupModeMenu.risingEdge',
                    default: 'rising edge',
                    description: 'label for rising edge interrup'
                }),
                value: InterrupMode.Rising
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.InterrupModeMenu.fallingEdge',
                    default: 'falling edge',
                    description: 'label for falling edge interrup'
                }),
                value: InterrupMode.Falling
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.InterrupModeMenu.changeEdge',
                    default: 'change edge',
                    description: 'label for change edge interrup'
                }),
                value: InterrupMode.Change
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.InterrupModeMenu.low',
                    default: 'low level',
                    description: 'label for low level interrup'
                }),
                value: InterrupMode.LowLevel
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.InterrupModeMenu.high',
                    default: 'high level',
                    description: 'label for high level interrup'
                }),
                value: InterrupMode.HighLevel
            }
        ];
    }

    get SERIAL_NO_MENU () {
        return [
            {
                text: '0',
                value: SerialNo.Serial0
            },
            // Usually IO9/10 is reserved for flash chip.
            // {
            //     text: '1',
            //     value: SerialNo.Serial1
            // },
            {
                text: '2',
                value: SerialNo.Serial2
            }
        ];
    }

    get BAUDTATE_MENU () {
        return [
            {
                text: '4800',
                value: Buadrate.B4800
            },
            {
                text: '9600',
                value: Buadrate.B9600
            },
            {
                text: '19200',
                value: Buadrate.B19200
            },
            {
                text: '38400',
                value: Buadrate.B38400
            },
            {
                text: '57600',
                value: Buadrate.B57600
            },
            {
                text: '76800',
                value: Buadrate.B76800
            },
            {
                text: '115200',
                value: Buadrate.B115200
            }
        ];
    }

    get EOL_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'arduinoEsp32.eolMenu.warp',
                    default: 'warp',
                    description: 'label for warp print'
                }),
                value: Eol.Warp
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.eolMenu.noWarp',
                    default: 'no-warp',
                    description: 'label for no warp print'
                }),
                value: Eol.NoWarp
            }
        ];
    }

    get DATA_TYPE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'arduinoEsp32.dataTypeMenu.integer',
                    default: 'integer',
                    description: 'label for integer'
                }),
                value: DataType.Integer
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.dataTypeMenu.decimal',
                    default: 'decimal',
                    description: 'label for decimal number'
                }),
                value: DataType.Decimal
            },
            {
                text: formatMessage({
                    id: 'arduinoEsp32.dataTypeMenu.string',
                    default: 'string',
                    description: 'label for string'
                }),
                value: DataType.String
            }
        ];
    }

    /**
     * Construct a set of Arduino blocks.
     * @param {Runtime} runtime - the OpenBlock runtime.
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, originalDeviceId) {
        /**
         * The OpenBlock runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new Arduino esp32 peripheral instance
        this._peripheral = new ArduinoEsp321(this.runtime, this.DEVICE_ID, originalDeviceId);
    }

    /**
     * @returns {Array.<object>} metadata for this extension and its blocks.
     */
    getInfo () {
        return [
            {
                id: 'pin',
                name: formatMessage({
                    id: 'arduinoEsp321.category.pins',
                    default: 'Pins',
                    description: 'The name of the esp32 arduino device pin category',
                }),
                color1: '#ff5d5d',
                color2: '#e24646',
                color3: '#da4444',
                //blockIconURI: blockIconURI,
                blocks: [
                    {
                        opcode: 'readDigitalPin',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.readDigitalPin',
                            default: 'read sensor pin [PIN]',
                            description: 'arduinoEsp32 read digital pin'
                        }),
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'sensorPins',
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'readAnalogPin',
                        text: formatMessage({
                            id: 'arduinoEsp32.pins.readAnalogPin',
                            default: 'analog read sensor pin [PIN]',
                            description: 'arduinoEsp32 read analog pin'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'sensorPins',
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'esp32ReadTouchPin',
                        text: formatMessage({
                            id: 'arduinoEsp32.pins.esp32ReadTouchPin',
                            default: 'read touch pin [PIN]',
                            description: 'arduinoEsp32 read touch pin'
                        }),
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'touchPins',
                                defaultValue: Pins.IO1
                            }
                        }
                    },
                    {
                        opcode: 'read_ultrasonic',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.esp32Readultrasonic',
                            default: 'read Ultrasonic sensor',
                            description: 'arduinoEsp32 read ultrsonic pin'
                        }),
                        blockType: BlockType.REPORTER,
                    },
                    {
                        opcode: 'readswitchPin',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.readswitchPin',
                            default: 'read switch pin [PIN]',
                            description: 'arduinoEsp32 read digital pin'
                        }),
                        blockType: BlockType.BOOLEAN,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'switchPins',
                                defaultValue: Pins.IO1
                            }
                        }
                    },
                    {
                        opcode: 'writebuzzerPin',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.writebuzzerPin',
                            default: 'make Buzzer pin to [PIN]',
                            description: 'arduinoEsp32 read digital pin'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'buzzerPins',
                                defaultValue: 'beep on'
                            }
                        }
                    },
                    '---',
                    {

                        opcode: 'esp32SetServoOutput',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.setServoOutput',
                            default: 'set servo pin [PIN] write [OUT]',
                            description: 'arduinoEsp32 set servo pin out'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'servoPins',
                                defaultValue: Pins.IO1
                            },
                            OUT: {
                                type: ArgumentType.HALF_ANGLE,
                                defaultValue: '90'
                            }
                        }
                    },
                    {

                        opcode: 'fablemovement',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.setfabelmovement',
                            default: 'make Fable movement [PIN] @ speed [OUT]',
                            description: 'arduinoEsp32 set servo pin out'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'fablemovementPins',
                                defaultValue: 'Forward'
                            },
                            OUT: {
                                type: ArgumentType.STRING,
                                menu: 'speed',
                                defaultValue: 'Average Speed'
                            }
                        }
                    },
                    {

                        opcode: 'Rightmotormovement',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.setRightmotormovement',
                            default: 'Run Right Motor  [PIN] @ speed [OUT]',
                            description: 'arduinoEsp32 set servo pin out'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'rightmotorPins',
                                defaultValue: 'Forward'
                            },
                            OUT: {
                                type: ArgumentType.STRING,
                                menu: 'speed',
                                defaultValue: 'Average Speed'
                            }
                        }
                    },
                    {

                        opcode: 'Leftmotormovement',
                        text: formatMessage({
                            id: 'arduinoEsp321.pins.setleftmotormovement',
                            default: 'Run Left Motor  [PIN] @ speed [OUT]',
                            description: 'arduinoEsp32 set servo pin out'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            PIN: {
                                type: ArgumentType.STRING,
                                menu: 'LeftmotorPins',
                                defaultValue: 'Forward'
                            },
                            OUT: {
                                type: ArgumentType.STRING,
                                menu: 'speed',
                                defaultValue: 'Average Speed'
                            }
                        }
                    },

                    '---',
                    


                ],
                menus: {
                    pins: {
                        items: this.PINS_MENU
                    },
                    outPins: {
                        items: this.OUT_PINS_MENU
                    },
                    mode: {
                        items: this.MODE_MENU
                    },
                    analogPins: {
                        items: this.ANALOG_PINS_MENU
                    },
                    level: {
                        acceptReporters: true,
                        items: this.LEVEL_MENU
                    },
                    ledcChannels: {
                        items: this.LEDC_CHANNELS_MENU
                    },
                    dacPins: {
                        items: this.DAC_PINS_MENU
                    },
                    sensorPins: {
                        items: this.SENSOR_PINS_MENU
                    },
                    touchPins: {
                        items: this.TOUCH_PINS_MENU
                    },
                    servoPins: {
                        items: this.SERVO_PINS_MENU
                    },
                    switchPins: {
                        items: this.SWITCH_PINS_MENU
                    },
                    buzzerPins: {
                        items: this.BUZZER_PINS_MENU
                    },
                    fablemovementPins: {
                        items: this.FABLE_PINS_MENU
                    },
                    rightmotorPins: {
                        items: this.RIGHTMOTOR_PINS_MENU
                    },
                    LeftmotorPins: {
                        items: this.LEFTMOTOR_PINS_MENU
                    },
                    interruptMode: {
                        items: this.INTERRUP_MODE_MENU
                    },
                    speed: {
                    items: [
                        { text: '🐢 Slow', value: 'Slow' },
                        { text: '🚶 Medium', value: 'Medium' },
                        { text: '🏃 Average Speed', value: 'Average Speed' },
                        { text: '🚀 Fast', value: 'Fast' }
                        ]
                        }
                    }
            },
            {
                id: 'display',
                name: formatMessage({
                    id: 'arduinoEsp321.category.display',
                    default: 'Display',
                    description: 'The name of the Arduino Uno R4 Wifi device display category'
                }),
                color1: '#35C0D4',
                color2: '#209AAB',
                color3: '#32B4C7',
                blocks: [
                    {
                        opcode: 'showImage',
                        text: formatMessage({
                            id: 'arduinoUnoR4Wifi.display.showImage',
                            default: 'show image [VALUE] with [color] color',
                            description: 'Arduino Uno R4 Wifi show image'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            VALUE: {
                                type: ArgumentType.MATRIX8X8,
                                defaultValue: '0000000001100110100110011000000101000010001001000001100000000000' // eslint-disable-line max-len
                            },

                            color: {
                                type: ArgumentType.STRING,
                                menu: 'colours',    
                                defaultValue: '🔴 Red'
                            }
                        }
                    },
                    {
                        opcode: 'showemotions',
                        text: formatMessage({
                            id: 'arduinoEsp321.display.showemotions',
                            default: 'Show emotion [EMOTION] on Led matrix',
                            description: 'Arduino Uno R4 Wifi light pixel at'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            EMOTION: {
                                type: ArgumentType.STRING,
                                menu: 'emotions',
                                defaultValue: '😊 Happy'
                            }
                        }
                    },
                    {
                        opcode: 'showImageUntil',
                        text: formatMessage({
                            id: 'arduinoUnoR4Wifi.display.showImageUntil',
                            default: 'show image [VALUE] for [TIME] secs with [color] color',
                            description: 'Arduino Uno R4 Wifi show image for some times'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            VALUE: {
                                type: ArgumentType.MATRIX8X8,
                                defaultValue: '0000000001100110100110011000000101000010001001000001100000000000' // eslint-disable-line max-len
                            },
                            TIME: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            color: {
                                type: ArgumentType.STRING,
                                menu: 'colours',    
                                defaultValue: '🔴 Red'
                            }
                        }
                    },
                    {
                        opcode: 'showUntilScrollDone',
                        text: formatMessage({
                            id: 'arduinoEsp321.display.showUntilScrollDone',
                            default: 'show [TEXT] until scroll done',
                            description: 'Arduino Uno R4 Wifi show until scroll done'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            TEXT: {
                                type: ArgumentType.STRING,
                                defaultValue: 'Hello Autoblox'
                            }
                        }
                    },
                    {
                        opcode: 'clearDisplay',
                        text: formatMessage({
                            id: 'arduinoEsp321.display.clearDisplay',
                            default: 'clear screen',
                            description: 'Arduino Uno R4 Wifi clear display'
                        }),
                        blockType: BlockType.COMMAND
                    },
                    {
                        opcode: 'lightPixelAt',
                        text: formatMessage({
                            id: 'arduinoEsp321.display.lightPixelAt',
                            default: 'light [STATE] at the x: [X] axis, y: [Y] axis',
                            description: 'Arduino Uno R4 Wifi light pixel at'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            STATE: {
                                type: ArgumentType.STRING,
                                menu: 'ledState',
                                defaultValue: LedState.On
                            },
                            X: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '0'
                            },
                            Y: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '0'
                            }
                        }
                    }
                ],
                menus: {
                    ledState: {
                        items: this.LEDSTATE_MENU
                    },
                emotions: {
                    items: [
                        { text: '😊 Happy', value: 'Happy' },
                        { text: '😢 Sad', value: 'Sad' },
                        { text: '😠 Angry', value: 'Angry' },
                        { text: '😮 Surprised', value: 'Surprised' },
                        { text: '😕 Confused', value: 'Confused' },
                        { text: '😴 Sleepy', value: 'Sleepy' },
                        { text: '🥱 Bored', value: 'Bored' },
                        { text: '🤩 Excited', value: 'Excited' }
                    ]
                },
                  colours: [
                        { text: '🔴 Red', value: 'Red' },
                         { text: '🟠 Orange', value: 'Orange' },
                        { text: '🟡 Yellow', value: 'Yellow' },
                        { text: '🟢 Green', value: 'Green' },
                        { text: '🔵 Blue', value: 'Blue' },
                        { text: '🟣 Purple', value: 'Purple' },
                         { text: '⚪ White', value: 'White' },
                        { text: '⚫ Black', value: 'Black' }
                        ]
                    
            }
        },
            {
                id: 'serial',
                name: formatMessage({
                    id: 'arduinoEsp32.category.serial',
                    default: 'Serial',
                    description: 'The name of the arduino esp32 device serial category'
                }),
                color1: '#9966FF',
                color2: '#774DCB',
                color3: '#774DCB',

                blocks: [
                    {
                        opcode: 'multiSerialBegin',
                        text: formatMessage({
                            id: 'arduinoEsp32.serial.multiSerialBegin',
                            default: 'serial [NO] begin baudrate [VALUE]',
                            description: 'arduinoEsp32 multi serial begin'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            },
                            VALUE: {
                                type: ArgumentType.STRING,
                                menu: 'baudrate',
                                defaultValue: Buadrate.B115200
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialPrint',
                        text: formatMessage({
                            id: 'arduinoEsp32.serial.multiSerialPrint',
                            default: 'serial [NO] print [VALUE] [EOL]',
                            description: 'arduinoEsp32 multi serial print'
                        }),
                        blockType: BlockType.COMMAND,
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            },
                            VALUE: {
                                type: ArgumentType.STRING,
                                defaultValue: 'Hello Autoblox'
                            },
                            EOL: {
                                type: ArgumentType.STRING,
                                menu: 'eol',
                                defaultValue: Eol.Warp
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialAvailable',
                        text: formatMessage({
                            id: 'arduinoEsp32.serial.multiSerialAvailable',
                            default: 'serial [NO] available data length',
                            description: 'arduinoEsp32 multi serial available data length'
                        }),
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            }
                        },
                        blockType: BlockType.REPORTER,
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'multiSerialReadAByte',
                        text: formatMessage({
                            id: 'arduinoEsp32.serial.multiSerialReadAByte',
                            default: 'serial [NO] read a byte',
                            description: 'arduinoEsp32 multi serial read a byte'
                        }),
                        arguments: {
                            NO: {
                                type: ArgumentType.NUMBER,
                                menu: 'serialNo',
                                defaultValue: SerialNo.Serial0
                            }
                        },
                        blockType: BlockType.REPORTER,
                        programMode: [ProgramModeType.UPLOAD]
                    }
                ],
                menus: {
                    baudrate: {
                        items: this.BAUDTATE_MENU
                    },
                    serialNo: {
                        items: this.SERIAL_NO_MENU
                    },
                    eol: {
                        items: this.EOL_MENU
                    }
                }
            },
            {
                id: 'data',
                name: formatMessage({
                    id: 'arduinoEsp32.category.data',
                    default: 'Data',
                    description: 'The name of the arduino esp32 device data category'
                }),
                color1: '#CF63CF',
                color2: '#C94FC9',
                color3: '#BD42BD',

                blocks: [
                    {
                        opcode: 'dataMap',
                        text: formatMessage({
                            id: 'arduinoEsp32.data.dataMap',
                            default: 'map [DATA] from ([ARG0], [ARG1]) to ([ARG2], [ARG3])',
                            description: 'arduinoEsp32 data map'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '50'
                            },
                            ARG0: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG1: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '100'
                            },
                            ARG2: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG3: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1000'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConstrain',
                        text: formatMessage({
                            id: 'arduinoEsp32.data.dataConstrain',
                            default: 'constrain [DATA] between ([ARG0], [ARG1])',
                            description: 'arduinoEsp32 data constrain'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '50'
                            },
                            ARG0: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '1'
                            },
                            ARG1: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '100'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    '---',
                    {
                        opcode: 'dataConvert',
                        text: formatMessage({
                            id: 'arduinoEsp32.data.dataConvert',
                            default: 'convert [DATA] to [TYPE]',
                            description: 'arduinoEsp32 data convert'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.STRING,
                                defaultValue: '123'
                            },
                            TYPE: {
                                type: ArgumentType.STRING,
                                menu: 'dataType',
                                defaultValue: DataType.Integer
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConvertASCIICharacter',
                        text: formatMessage({
                            id: 'arduinoEsp32.data.dataConvertASCIICharacter',
                            default: 'convert [DATA] to ASCII character',
                            description: 'arduinoEsp32 data convert to ASCII character'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.NUMBER,
                                defaultValue: '97'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    },
                    {
                        opcode: 'dataConvertASCIINumber',
                        text: formatMessage({
                            id: 'arduinoEsp32.data.dataConvertASCIINumber',
                            default: 'convert [DATA] to ASCII nubmer',
                            description: 'arduinoEsp32 data convert to ASCII nubmer'
                        }),
                        blockType: BlockType.REPORTER,
                        arguments: {
                            DATA: {
                                type: ArgumentType.STRING,
                                defaultValue: 'a'
                            }
                        },
                        programMode: [ProgramModeType.UPLOAD]
                    }
                ],
                menus: {
                    dataType: {
                        items: this.DATA_TYPE_MENU
                    }
                }
            }
        ];
    }

    /**
     * Set pin mode.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after the set pin mode is done.
     */
    setPinMode (args) {
        this._peripheral.setPinMode(args.PIN, args.MODE);
        return Promise.resolve();
    }

    /**
     * Set pin digital out level.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after the set pin digital out level is done.
     */
    setDigitalOutput (args) {
        this._peripheral.setDigitalOutput(args.PIN, args.LEVEL);
        return Promise.resolve();
    }

readDigitalPin(args) {
    return new Promise(resolve => {
        const pin = args.PIN;  // get pin number from block arg
        const cmd = `D${pin}`; // command format: D + pin number
        this._peripheral.requestData(cmd, value => {
            resolve(Number(value));
        });
    });
}

readAnalogPin(args) {
    return new Promise(resolve => {
        const pin = args.PIN;  // get pin number from block arg
        const cmd = `A${pin}`; // command format: D + pin number
        this._peripheral.requestData(cmd, value => {
            resolve(Number(value));
        });
    });
}

fablemovement(args) {
    const letter= args.PIN;
    if(letter=='F'){
        this._peripheral.write('0xA1' + '\n');
    }
        if(letter=='B'){
        this._peripheral.write('0xA2' + '\n');
    }
        if(letter=='R'){
        this._peripheral.write('0xA4' + '\n');
    }
        if(letter=='L'){
        this._peripheral.write('0xA3' + '\n');
    }
        if(letter=='S'){
        this._peripheral.write('0xA5' + '\n');
    }
}

    /**
     * Set pin pwm out value.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after the set pin pwm out value is done.
     */
    setPwmOutput (args) {
        this._peripheral.setPwmOutput(args.PIN, args.OUT);
        return Promise.resolve();
    }


    /**
     * Set servo out put.
     * @param {object} args - the block's arguments.
     * @return {Promise} - a Promise that resolves after the set servo out value is done.
     */
    setServoOutput (args) {
        this._peripheral.setServoOutput(args.PIN, args.OUT);
        return Promise.resolve();
    }
}

module.exports = OpenBlockArduinoEsp321Device;
