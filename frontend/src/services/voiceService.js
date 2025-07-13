// Voice Service - Web Speech API integration for STT and TTS
import { agentVoiceProfiles } from '../config/VoicePersonalities';
import voiceCommandParser from './voiceCommandParser';

class VoiceService {
  constructor() {
    // Speech Recognition (STT) setup
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    
    // Speech Synthesis (TTS) setup
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    
    // Voice settings
    this.voiceSettings = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1
    };
    
    // Event callbacks
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onSpeechResult = null;
    this.onSpeechError = null;
    this.onSpeakingStart = null;
    this.onSpeakingEnd = null;
    
    // Command processing
    this.commandParser = voiceCommandParser;
    this.commandHandlers = new Map();
    this.isProcessingCommand = false;
    
    this.initializeSpeechRecognition();
  }

  // Initialize Speech Recognition
  initializeSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return false;
    }

    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = this.voiceSettings.continuous;
    this.recognition.interimResults = this.voiceSettings.interimResults;
    this.recognition.lang = this.voiceSettings.language;
    this.recognition.maxAlternatives = this.voiceSettings.maxAlternatives;

    // Set up event listeners
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Speech recognition started');
      if (this.onSpeechStart) this.onSpeechStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Speech recognition ended');
      if (this.onSpeechEnd) this.onSpeechEnd();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onSpeechResult) {
        this.onSpeechResult({
          final: finalTranscript,
          interim: interimTranscript,
          confidence: event.results[0]?.[0]?.confidence || 0
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onSpeechError) {
        this.onSpeechError({
          error: event.error,
          message: this.getErrorMessage(event.error)
        });
      }
    };

    return true;
  }

  // Start listening for speech
  startListening(onResult, onError, onCommand) {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      onError?.('Speech recognition not available in this browser');
      return;
    }

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      const confidence = event.results[event.resultIndex][0].confidence;
      
      console.log('Voice input:', transcript, 'Confidence:', confidence);
      
      // Process as potential command first
      const command = this.commandParser.parseCommand(transcript);
      
      if (command && command.confidence > 0.6) {
        console.log('Parsed command:', command);
        
        // Execute command
        this.executeCommand(command, onCommand);
        
        // Also send to regular result handler
        onResult?.({
          transcript,
          confidence,
          isCommand: true,
          command: command
        });
      } else {
        // Regular speech input
        onResult?.({
          transcript,
          confidence,
          isCommand: false,
          command: null
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event.error);
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError?.(error.message);
    }
  }

  // Execute parsed voice command
  async executeCommand(command, onCommand) {
    if (this.isProcessingCommand) {
      console.log('Already processing a command, skipping...');
      return;
    }

    this.isProcessingCommand = true;

    try {
      // Generate response message
      const responseText = this.commandParser.generateResponse(command);
      
      // Speak the response
      if (responseText) {
        await this.speak(responseText, 'system');
      }

      // Execute the command action
      if (onCommand && typeof onCommand === 'function') {
        await onCommand(command);
      }

      console.log('Command executed successfully:', command.action);
    } catch (error) {
      console.error('Error executing command:', error);
      await this.speak('Sorry, I had trouble executing that command.', 'system');
    } finally {
      this.isProcessingCommand = false;
    }
  }

  // Register command handler
  registerCommandHandler(action, handler) {
    this.commandHandlers.set(action, handler);
  }

  // Get available voice commands
  getAvailableCommands() {
    return this.commandParser.getAvailableCommands();
  }

  // Enhanced speak method with command feedback
  async speak(text, agentType = 'system', options = {}) {
    if (!this.synthesis) {
      console.error('Speech synthesis not available');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice profile based on agent type
        const profile = agentVoiceProfiles[agentType] || agentVoiceProfiles.system;
        
        // Find the best matching voice
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name.includes(profile.preferredVoice) ||
          voice.lang === profile.language
        ) || voices[0];

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Apply voice characteristics
        utterance.rate = options.rate || profile.rate;
        utterance.pitch = options.pitch || profile.pitch;
        utterance.volume = options.volume || profile.volume;

        // Add slight variation for more natural speech
        if (!options.exact) {
          utterance.rate += (Math.random() - 0.5) * 0.1;
          utterance.pitch += (Math.random() - 0.5) * 0.1;
        }

        utterance.onend = () => {
          console.log('Speech synthesis completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          reject(event);
        };

        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        // Start speaking
        this.synthesis.speak(utterance);
        
      } catch (error) {
        console.error('Error in speak method:', error);
        reject(error);
      }
    });
  }

  // Stop listening for speech
  stopListening() {
    if (!this.recognition || !this.isListening) {
      return false;
    }

    try {
      this.recognition.stop();
      return true;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      return false;
    }
  }

  // Stop current speech
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('🔊 Speech stopped');
      return true;
    }
    return false;
  }

  // Apply agent voice profile settings
  applyVoiceProfile(utterance, voiceProfile) {
    if (!voiceProfile.voice) return;

    const { voice } = voiceProfile;
    
    // Set basic voice parameters
    if (voice.rate) utterance.rate = voice.rate;
    if (voice.pitch) utterance.pitch = voice.pitch;
    if (voice.volume) utterance.volume = voice.volume;

    // Try to find and set preferred voice
    if (voice.preferredVoice) {
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes(voice.preferredVoice.toLowerCase()) ||
        v.lang.includes(voice.language || 'en-US')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`🎭 Using voice: ${preferredVoice.name} for ${voiceProfile.name || 'agent'}`);
      }
    }
  }

  // Get available voices
  getAvailableVoices() {
    if (!this.synthesis) return [];
    
    const voices = this.synthesis.getVoices();
    return voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: this.detectGender(voice.name),
      localService: voice.localService,
      default: voice.default
    }));
  }

  // Detect voice gender from name (basic heuristic)
  detectGender(voiceName) {
    const maleTags = ['male', 'man', 'guy', 'david', 'john', 'alex', 'daniel', 'tom'];
    const femaleTags = ['female', 'woman', 'lady', 'sarah', 'alice', 'emma', 'emily', 'susan'];
    
    const lowerName = voiceName.toLowerCase();
    
    if (maleTags.some(tag => lowerName.includes(tag))) return 'male';
    if (femaleTags.some(tag => lowerName.includes(tag))) return 'female';
    
    return 'unknown';
  }

  // Get error message for speech recognition errors
  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'Language not supported for speech recognition.'
    };
    
    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  // Check if voice features are supported
  isSupported() {
    return {
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      speechSynthesis: !!window.speechSynthesis,
      both: !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !!window.speechSynthesis
    };
  }

  // Update voice settings
  updateSettings(newSettings) {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings };
    
    if (this.recognition) {
      this.recognition.lang = this.voiceSettings.language;
      this.recognition.continuous = this.voiceSettings.continuous;
      this.recognition.interimResults = this.voiceSettings.interimResults;
      this.recognition.maxAlternatives = this.voiceSettings.maxAlternatives;
    }
  }

  // Get current status
  getStatus() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isSupported: this.isSupported(),
      voiceSettings: this.voiceSettings,
      availableVoices: this.getAvailableVoices().length
    };
  }

  // Set event callbacks
  setEventCallbacks(callbacks) {
    this.onSpeechStart = callbacks.onSpeechStart || null;
    this.onSpeechEnd = callbacks.onSpeechEnd || null;
    this.onSpeechResult = callbacks.onSpeechResult || null;
    this.onSpeechError = callbacks.onSpeechError || null;
    this.onSpeakingStart = callbacks.onSpeakingStart || null;
    this.onSpeakingEnd = callbacks.onSpeakingEnd || null;
  }

  // Cleanup
  destroy() {
    this.stopListening();
    this.stopSpeaking();
    this.recognition = null;
    this.synthesis = null;
  }
}

// Create and export a singleton instance
const voiceService = new VoiceService();

export default voiceService;

// Export the class for creating additional instances if needed
export { VoiceService };
