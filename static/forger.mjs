/**
 * @typedef {Object} Voice
 * @property {() => void} init
 * @property {() => void} start
 * @property {() => void} stop
 */

/**
 * @typedef {Object} Modulator
 * @property {OscillatorNode} modulator
 * @property {GainNode} gainNode
 */

/**
 * @param {AudioContext} ctx
 * @returns {Voice}
 */
const makeVoice = (ctx) => {
  /**
   * @param {OscillatorType} type
   * @param {number} freq
   * @param {number} gain
   * @returns {Modulator}
   */
  const createModulator = (type, freq, gain) => {
    const modulator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    modulator.type = type;
    modulator.frequency.value = freq;
    gainNode.gain.value = gain;
    modulator.connect(gainNode);
    return { modulator, gainNode };
  };

  /**
   * @param {number} freq
   * @returns {OscillatorNode}
   */
  const createCarrier = (freq) => {
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    return oscillator;
  };

  /**
   * @param {number} freq
   * @param {number} q
   * @returns {BiquadFilterNode}
   */
  const createFilter = (freq = 22000, q = 0) => {
    const filter = ctx.createBiquadFilter();
    filter.frequency.value = freq;
    filter.Q.value = q;
    return filter;
  };

  class EnvelopeGenerator {
    constructor(attack = 2.0, release = 10.0) {
      this.attack = attack;
      this.release = release;
    }

    /**
     * @param {AudioParam} param
     */
    connect(param) {
      this.param = param;
      this.param.value = 0;
    }

    on() {
      const now = ctx.currentTime;
      this.param?.cancelScheduledValues(now);
      this.param?.setValueAtTime(0, now);
      this.param?.linearRampToValueAtTime(0.2, now + this.attack);
    }

    off() {
      const now = ctx.currentTime;
      this.param?.setValueAtTime(this.param.value, now);
      this.param?.linearRampToValueAtTime(0.0, now + this.release);
    }
  }

  /**
   * @param {Modulator[]} modulators
   * @returns {Modulator}
   */
  const createModulatorStack = (modulators) =>
    modulators.reduce(function (input, output) {
      input.gainNode.connect(output.modulator.frequency);
      return output;
    });

  const modulators = [
    createModulator('sine', 100 + 10000 * Math.random(), 100 + 10000 * Math.random()),
    createModulator('sine', 100 + 10000 * Math.random(), 100 + 10000 * Math.random()),
    createModulator('sine', 100 + 10000 * Math.random(), 100 + 10000 * Math.random()),
  ];
  const modulatorStack = createModulatorStack(modulators);
  const carrier = createCarrier(20 + 15000 * Math.random());
  const filter = createFilter();
  const gainNode = ctx.createGain();
  const env = new EnvelopeGenerator();

  modulatorStack.gainNode.connect(carrier.frequency);
  carrier.connect(filter);
  filter.connect(gainNode);
  env.connect(gainNode.gain);
  gainNode.connect(ctx.destination);

  const init = () => {
    modulators.forEach((m) => m.modulator.start(0));
    carrier.start(0);
  };

  const start = () => {
    for (const { modulator, gainNode } of modulators) {
      modulator.frequency.value = 10000 * Math.random();
      gainNode.gain.value = 10000 * Math.random();
    }
    carrier.frequency.value = 20 + 5000 * Math.random();
    env.on();
  };

  const stop = () => env.off();

  return {
    init,
    start,
    stop,
  };
};

/**
 * @param {AudioContext} context
 * @param {number} count
 * @returns {Generator<Voice>}
 */
function* voiceHandler(context, count) {
  const voices = Array.from({ length: count }, () => makeVoice(context));
  voices.forEach((v) => v.init());

  while (true) {
    for (let voice of voices) {
      yield voice;
    }
  }
}

/** @type {AudioContext | undefined} */
let context;

/** @type {Generator<Voice> | undefined} */
let voiceCycle;

/** @type {Voice | undefined} */
let currentVoice;

const initAudioContext = () => {
  if (!context) {
    context = new AudioContext();
    voiceCycle = voiceHandler(context, 4);
    currentVoice = voiceCycle.next().value;
  } else if (context.state === 'suspended') {
    context.resume();
  }
};
document.getElementById('playArea')?.addEventListener('mousedown', function () {
  initAudioContext();
  currentVoice?.start();
});

document.getElementById('playArea')?.addEventListener('mouseup', function () {
  currentVoice?.stop();
  currentVoice = voiceCycle?.next().value;
});
