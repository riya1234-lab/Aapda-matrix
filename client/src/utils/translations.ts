export interface TranslationDictionary {
  appTitle: string;
  tagline: string;
  batteryStatus: string;
  locProtocol: string;
  locAcquiring: string;
  locActive: string;
  identifyEmergency: string;
  womenSafety: string;
  naturalDisaster: string;
  medicalEmergency: string;
  roadAccident: string;
  fireEmergency: string;
  personalSafety: string;
  policeAssistance: string;
  disasterEmergency: string;
  situationalIntel: string;
  intelPlaceholder: string;
  activateSos: string;
  recordingAudio: string;
  transmitting: string;
  communityFeedback: string;
  safetySops: string;
  callDispatch: string;
  home: string;
  myIncidents: string;
  contacts: string;
  profile: string;
  commandCenter: string;
  aiAssistant: string;
  aiPlaceholder: string;
  askAi: string;
  sendDistress: string;
  offlineNotice: string;
  syncedNotice: string;
}

export const translations: Record<'en' | 'mr' | 'hi', TranslationDictionary> = {
  en: {
    appTitle: 'AAPDA MATRIX V4.0',
    tagline: 'One Tap. One Network. One Lifeline.',
    batteryStatus: 'BATTERY STATUS',
    locProtocol: 'LOC PROTOCOL',
    locAcquiring: 'ACQUIRING GPS...',
    locActive: 'GPS ACTIVE',
    identifyEmergency: 'IDENTIFY EMERGENCY TYPE',
    womenSafety: 'WOMEN SAFETY',
    naturalDisaster: 'NATURAL DISASTER',
    medicalEmergency: 'MEDICAL EMERGENCY',
    roadAccident: 'ROAD ACCIDENT',
    fireEmergency: 'FIRE EMERGENCY',
    personalSafety: 'PERSONAL SAFETY',
    policeAssistance: 'POLICE ASSISTANCE',
    disasterEmergency: 'DISASTER EMERGENCY',
    situationalIntel: 'SITUATIONAL INTEL (OPTIONAL)',
    intelPlaceholder: 'Describe your situation or list injuries...',
    activateSos: 'ACTIVATE SOS',
    recordingAudio: 'RECORDING AUDIO...',
    transmitting: 'TRANSMITTING DISTRESS SIGNAL...',
    communityFeedback: 'COMMUNITY FEEDBACK: REPORT HARMFUL AREA',
    safetySops: 'Safety SOPs',
    callDispatch: 'Call 112 Dispatch',
    home: 'Home',
    myIncidents: 'My Incidents',
    contacts: 'Emergency Contacts',
    profile: 'Profile',
    commandCenter: 'Command Center',
    aiAssistant: 'AI Emergency Assistant',
    aiPlaceholder: 'Describe what happened (e.g. "Kitchen fire with heavy smoke")...',
    askAi: 'Analyze Emergency',
    sendDistress: 'Broadcast SOS Now',
    offlineNotice: 'You are currently offline. SOS signals will be queued and transmitted via BLE mesh or upon reconnect.',
    syncedNotice: 'All pending distress signals have been synchronized with the Command Center.',
  },
  mr: {
    appTitle: 'आपदा मैट्रिक्स V4.0',
    tagline: 'एक टॅप. एक नेटवर्क. एक जीवनरेखा.',
    batteryStatus: 'बॅटरीची स्थिती',
    locProtocol: 'लोकेशन प्रोटोकॉल',
    locAcquiring: 'GPS मिळवत आहे...',
    locActive: 'GPS सक्रिय (थेट)',
    identifyEmergency: 'आणीबाणीचा प्रकार ओळखा',
    womenSafety: 'महिला सुरक्षा',
    naturalDisaster: 'नैसर्गिक आपत्ती',
    medicalEmergency: 'वैद्यकीय आणीबाणी',
    roadAccident: 'रस्ता अपघात',
    fireEmergency: 'आग आणीबाणी',
    personalSafety: 'वैयक्तिक सुरक्षा',
    policeAssistance: 'पोलीस मदत',
    disasterEmergency: 'आपत्ती आणीबाणी',
    situationalIntel: 'परिस्थितीची माहिती (ऐच्छिक)',
    intelPlaceholder: 'तुमची परिस्थिती सांगा किंवा जखमांची नोंद करा...',
    activateSos: 'SOS सक्रिय करा',
    recordingAudio: 'ऑडिओ रेकॉर्ड होत आहे...',
    transmitting: 'मदत संदेश पाठवत आहे...',
    communityFeedback: 'सामाजिक प्रतिक्रिया: धोकादायक क्षेत्राची नोंद करा',
    safetySops: 'सुरक्षा मार्गदर्शक',
    callDispatch: '112 हेल्पलाईनला कॉल करा',
    home: 'मुख्यपृष्ठ',
    myIncidents: 'माझ्या नोंदी',
    contacts: 'आपत्कालीन संपर्क',
    profile: 'माझी माहिती',
    commandCenter: 'कमांड सेंटर',
    aiAssistant: 'AI आपत्कालीन सहाय्यक',
    aiPlaceholder: 'काय घडले ते सांगा (उदा. "किचनमध्ये आग लागली आहे")...',
    askAi: 'आणीबाणी तपासा',
    sendDistress: 'आत्ताच SOS पाठवा',
    offlineNotice: 'तुम्ही सध्या ऑफलाइन आहात. SOS मेसेज BLE मेशद्वारे किंवा इंटरनेट सुरू होताच पाठवला जाईल.',
    syncedNotice: 'सर्व प्रलंबित आपत्कालीन संदेश कमांड सेंटरशी सिंक झाले आहेत.',
  },
  hi: {
    appTitle: 'आपदा मैट्रिक्स V4.0',
    tagline: 'एक टैप। एक नेटवर्क। एक जीवनरेखा।',
    batteryStatus: 'बैटरी स्थिति',
    locProtocol: 'लोकेशन प्रोटोकॉल',
    locAcquiring: 'जीपीएस खोज रहा है...',
    locActive: 'जीपीएस सक्रिय',
    identifyEmergency: 'आपातकालीन प्रकार चुनें',
    womenSafety: 'महिला सुरक्षा',
    naturalDisaster: 'प्राकृतिक आपदा',
    medicalEmergency: 'चिकित्सा आपातकाल',
    roadAccident: 'सड़क दुर्घटना',
    fireEmergency: 'आग आपातकाल',
    personalSafety: 'व्यक्तिगत सुरक्षा',
    policeAssistance: 'पुलिस सहायता',
    disasterEmergency: 'आपदा आपातकाल',
    situationalIntel: 'स्थिति की जानकारी (वैकल्पिक)',
    intelPlaceholder: 'अपनी स्थिति बताएं या चोटों का विवरण दें...',
    activateSos: 'SOS सक्रिय करें',
    recordingAudio: 'आवाज रिकॉर्ड हो रही है...',
    transmitting: 'संकट संदेश भेजा जा रहा है...',
    communityFeedback: 'सामुदायिक प्रतिक्रिया: खतरनाक क्षेत्र की रिपोर्ट करें',
    safetySops: 'सुरक्षा दिशानिर्देश',
    callDispatch: '112 पर तुरंत कॉल करें',
    home: 'होम',
    myIncidents: 'मेरी घटनाएं',
    contacts: 'आपातकालीन संपर्क',
    profile: 'प्रोफाइल',
    commandCenter: 'कमांड सेंटर',
    aiAssistant: 'AI आपातकालीन सहायक',
    aiPlaceholder: 'क्या हुआ बताएं (उदा. "किचन में आग लगी है")...',
    askAi: 'आपातकाल का विश्लेषण करें',
    sendDistress: 'अभी SOS भेजें',
    offlineNotice: 'आप वर्तमान में ऑफ़लाइन हैं। SOS संदेश BLE मेश या इंटरनेट आने पर भेजा जाएगा।',
    syncedNotice: 'सभी लंबित संकट संदेश कमांड सेंटर में सफलतापूर्वक सिंक हो गए हैं।',
  },
};
