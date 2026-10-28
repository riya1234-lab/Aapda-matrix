export interface TranslationDictionary {
  appTitle: string;
  tagline: string;
  batteryStatus: string;
  locProtocol: string;
  locAcquiring: string;
  locActive: string;
  locRequired: string;
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

  // New Comprehensive Translations for All Features
  emergencyDirectory: string;
  myCircle: string;
  addPredefinedContact: string;
  contactName: string;
  phoneNumber: string;
  relation: string;
  notifyOnLowBattery: string;
  saveContact: string;
  deleteContact: string;
  callDirect: string;
  sendSms: string;

  // Priorities
  priorityLevel: string;
  criticalPriority: string;
  highPriority: string;
  moderatePriority: string;
  lowPriority: string;

  // Low Battery Location Share
  batteryCriticalAlert: string;
  batteryAutoShareDesc: string;
  shareLocationNow: string;
  locationShared: string;

  // Help on the way
  helpOnTheWay: string;
  unitDispatched: string;
  etaLabel: string;
  stayPutNotice: string;

  // Disasters
  landslide: string;
  flood: string;
  earthquake: string;
  cyclone: string;
  buildingCollapse: string;
  industrialAccident: string;
  extremeWeather: string;
  otherEmergency: string;
  disasterHelpline: string;
}

export const translations: Record<'en' | 'mr' | 'hi', TranslationDictionary> = {
  en: {
    appTitle: 'AAPDA MATRIX V4.0',
    tagline: 'One Tap. One Network. One Lifeline.',
    batteryStatus: 'BATTERY STATUS',
    locProtocol: 'LOC PROTOCOL',
    locAcquiring: 'EXTRACTING GPS...',
    locActive: 'GPS LOCK VERIFIED',
    locRequired: 'GPS FIX REQUIRED FOR SOS',
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
    safetySops: 'Safety Protocols',
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
    offlineNotice: 'You are currently offline. SOS signals are queued locally until internet connectivity is established.',
    syncedNotice: 'All pending distress signals have been synchronized with the Command Center.',

    emergencyDirectory: 'Emergency Services Directory',
    myCircle: 'Predefined Personal Contacts',
    addPredefinedContact: '+ Add Personal Contact',
    contactName: 'Full Name',
    phoneNumber: 'Phone Number',
    relation: 'Relationship (e.g. Family, Doctor)',
    notifyOnLowBattery: 'Auto-share GPS location when battery < 10%',
    saveContact: 'Save Emergency Contact',
    deleteContact: 'Delete',
    callDirect: 'Call Now',
    sendSms: 'Send Emergency SMS',

    priorityLevel: 'EMERGENCY SEVERITY LEVEL',
    criticalPriority: 'CRITICAL (Life Threat)',
    highPriority: 'HIGH (Urgent Assistance)',
    moderatePriority: 'MODERATE (Stable / Hazard)',
    lowPriority: 'LOW (Advisory / Non-Urgent)',

    batteryCriticalAlert: 'CRITICAL BATTERY ALERT (< 10%)',
    batteryAutoShareDesc: 'Battery is dangerously low. Broadcasting your current GPS location to your predefined emergency contacts.',
    shareLocationNow: 'Share Location via SMS Now',
    locationShared: 'Location coordinates shared with contacts.',

    helpOnTheWay: 'HELP IS ON THE WAY!',
    unitDispatched: 'Emergency unit dispatched to your exact GPS coordinates.',
    etaLabel: 'Estimated Arrival',
    stayPutNotice: 'Remain in a secure position. Responders have your coordinates and voice note.',

    landslide: 'Landslide / Mudflow',
    flood: 'Flash Flood / Inundation',
    earthquake: 'Earthquake / Tremor',
    cyclone: 'Cyclone / Storm Surge',
    buildingCollapse: 'Building Collapse / Rubble',
    industrialAccident: 'Chemical / Gas Leak',
    extremeWeather: 'Cloudburst / Lightning',
    otherEmergency: 'Other Calamity',
    disasterHelpline: 'Emergency Calamity Helpline',
  },
  mr: {
    appTitle: 'आपदा मैट्रिक्स V4.0',
    tagline: 'एक टॅप. एक नेटवर्क. एक जीवनरेखा.',
    batteryStatus: 'बॅटरीची स्थिती',
    locProtocol: 'लोकेशन प्रोटोकॉल',
    locAcquiring: 'GPS मिळवत आहे...',
    locActive: 'GPS लॉक सत्यापित (थेट)',
    locRequired: 'SOS पाठवण्यासाठी GPS आवश्यक आहे',
    identifyEmergency: 'आणीबाणीचा प्रकार निवडा',
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
    offlineNotice: 'तुम्ही सध्या ऑफलाइन आहात. इंटरनेट सुरू होईपर्यंत SOS संदेश स्थानिकरित्या सुरक्षित राहील.',
    syncedNotice: 'सर्व प्रलंबित आपत्कालीन संदेश कमांड सेंटरशी सिंक झाले आहेत.',

    emergencyDirectory: 'आपत्कालीन सेवांची यादी',
    myCircle: 'माझे पूर्वनिर्धारित संपर्क',
    addPredefinedContact: '+ नवीन संपर्क जोडा',
    contactName: 'पूर्ण नाव',
    phoneNumber: 'मोबाईल नंबर',
    relation: 'नाते (उदा. कुटुंब, डॉक्टर)',
    notifyOnLowBattery: 'बॅटरी १०% पेक्षा कमी झाल्यावर आपोआप लोकेशन पाठवा',
    saveContact: 'संपर्क जतन करा',
    deleteContact: 'हटवा',
    callDirect: 'कॉल करा',
    sendSms: 'SMS पाठवा',

    priorityLevel: 'आणीबाणीची तीव्रता पातळी',
    criticalPriority: 'अति-गंभीर (जीव धोक्यात)',
    highPriority: 'उच्च (त्वरित मदत आवश्यक)',
    moderatePriority: 'मध्यम (धोका / स्थिर)',
    lowPriority: 'कमी (माहिती / सामान्य)',

    batteryCriticalAlert: 'अति-कमी बॅटरी सूचना (< १०%)',
    batteryAutoShareDesc: 'बॅटरी संपत आली आहे. तुमचे GPS लोकेशन पूर्वनिर्धारित संपर्कांना पाठवले जात आहे.',
    shareLocationNow: 'SMS द्वारे लोकेशन पाठवा',
    locationShared: 'संपर्कांना लोकेशन पाठवले गेले.',

    helpOnTheWay: 'मदत तुमच्या दिशेने येत आहे!',
    unitDispatched: 'बचाव पथक तुमच्या अचूक GPS स्थानावर रवाना झाले आहे.',
    etaLabel: 'अंदाजे वेळ',
    stayPutNotice: 'सुरक्षित ठिकाणी थांबा. बचाव पथकाकडे तुमची माहिती पोहोचली आहे.',

    landslide: 'दरड कोसळणे / चिखल',
    flood: 'पूर / जलमय परिस्थिती',
    earthquake: 'भूकंप / हादरे',
    cyclone: 'चक्रीवादळ / सोसाट्याचा वारा',
    buildingCollapse: 'इमारत कोसळणे',
    industrialAccident: 'रासायनिक / गॅस गळती',
    extremeWeather: 'ढगफुटी / विजांचा कडकडाट',
    otherEmergency: 'इतर आपत्ती',
    disasterHelpline: 'आपत्ती विशेष हेल्पलाईन',
  },
  hi: {
    appTitle: 'आपदा मैट्रिक्स V4.0',
    tagline: 'एक टैप। एक नेटवर्क। एक जीवनरेखा।',
    batteryStatus: 'बैटरी स्थिति',
    locProtocol: 'लोकेशन प्रोटोकॉल',
    locAcquiring: 'जीपीएस प्राप्त किया जा रहा है...',
    locActive: 'जीपीएस लॉक सत्यापित',
    locRequired: 'SOS भेजने के लिए जीपीएस अनिवार्य है',
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
    offlineNotice: 'आप वर्तमान में ऑफ़लाइन हैं। इंटरनेट बहाल होने तक SOS स्थानीय कतार में सुरक्षित रहेगा।',
    syncedNotice: 'सभी लंबित संकट संदेश कमांड सेंटर में सफलतापूर्वक सिंक हो गए हैं।',

    emergencyDirectory: 'आपातकालीन सेवा निर्देशिका',
    myCircle: 'मेरे पूर्वनिर्धारित संपर्क',
    addPredefinedContact: '+ नया संपर्क जोड़ें',
    contactName: 'पूरा नाम',
    phoneNumber: 'फ़ोन नंबर',
    relation: 'संबंध (उदा. परिवार, डॉक्टर)',
    notifyOnLowBattery: 'बैटरी १०% से कम होने पर स्वतः GPS लोकेशन साझा करें',
    saveContact: 'संपर्क सहेजें',
    deleteContact: 'हटाएं',
    callDirect: 'कॉल करें',
    sendSms: 'SMS भेजें',

    priorityLevel: 'आपातकाल गंभीरता स्तर',
    criticalPriority: 'अति-गंभीर (जीवन संकट)',
    highPriority: 'उच्च (त्वरित सहायता आवश्यक)',
    moderatePriority: 'मध्यम (स्थिर / जोखिम)',
    lowPriority: 'कम (सलाहकारी / गैर-आपातकालीन)',

    batteryCriticalAlert: 'अति-निम्न बैटरी चेतावनी (< १०%)',
    batteryAutoShareDesc: 'फ़ोन की बैटरी बेहद कम है। आपका वर्तमान GPS लोकेशन आपके पूर्वनिर्धारित संपर्कों को साझा किया जा रहा है।',
    shareLocationNow: 'SMS द्वारा लोकेशन तुरंत साझा करें',
    locationShared: 'संपर्कों को लोकेशन भेज दी गई है।',

    helpOnTheWay: 'मदद आपके पास पहुँच रही है!',
    unitDispatched: 'राहत एवं बचाव दल आपके सटीक GPS पते पर रवाना कर दिया गया है।',
    etaLabel: 'अनुमानित समय',
    stayPutNotice: 'कृपया सुरक्षित स्थान पर बने रहें। बचाव दल के पास आपकी लोकेशन और आवाज संदेश उपलब्ध है।',

    landslide: 'भूस्खलन / मलबा',
    flood: 'बाढ़ / जलभराव',
    earthquake: 'भूकंप / झटके',
    cyclone: 'चक्रवात / आंधी',
    buildingCollapse: 'इमारत ढहना / मलबा',
    industrialAccident: 'रासायनिक / गैस रिसाव',
    extremeWeather: 'बादल फटना / आकाशीय बिजली',
    otherEmergency: 'अन्य आपदा',
    disasterHelpline: 'आपदा विशेष हेल्पलाइन',
  },
};
