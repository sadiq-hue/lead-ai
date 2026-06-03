import { useState } from "react";
import { Search, MoreVertical, Send, Bot, User, CheckCircle2, Clock, Trash2, Archive, X, Plus } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Sarah Chen",
    company: "TechCorp",
    avatar: "SC",
    lastMessage: "That sounds perfect, I'd love to schedule a demo",
    time: "2m",
    unread: true,
    status: "qualified",
    email: "sarah.chen@techcorp.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    leadScore: 85,
    scoreBreakdown: { intent: 90, budget: 85, timeline: 80, authority: 85 },
    tags: ["Interested", "Enterprise", "High Priority"],
    activities: [
      { type: "message", content: "Initial inquiry about lead management", time: "2 hours ago" },
      { type: "qualification", content: "Lead qualified - High intent", time: "1 hour ago" },
      { type: "ai_response", content: "AI scheduled demo for Thursday", time: "30 minutes ago" }
    ],
    qualificationChecklist: [
      { item: "Budget confirmed", completed: true },
      { item: "Timeline discussed", completed: true },
      { item: "Decision maker identified", completed: true },
      { item: "Demo scheduled", completed: false }
    ]
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    company: "StartupXYZ",
    avatar: "MR",
    lastMessage: "What are your pricing tiers?",
    time: "12m",
    unread: false,
    status: "booked",
    email: "michael@startupxyz.com",
    phone: "+1 (555) 987-6543",
    location: "Austin, TX",
    leadScore: 75,
    scoreBreakdown: { intent: 80, budget: 70, timeline: 75, authority: 75 },
    tags: ["Pricing Inquiry", "Startup"],
    activities: [
      { type: "message", content: "Asked about pricing tiers", time: "15 minutes ago" },
      { type: "ai_response", content: "Shared pricing information", time: "10 minutes ago" }
    ],
    qualificationChecklist: [
      { item: "Budget confirmed", completed: false },
      { item: "Timeline discussed", completed: true },
      { item: "Decision maker identified", completed: true },
      { item: "Demo scheduled", completed: true }
    ]
  },
  {
    id: 3,
    name: "Emma Williams",
    company: "Enterprise Co",
    avatar: "EW",
    lastMessage: "Can you tell me more about the features?",
    time: "1h",
    unread: true,
    status: "active",
    email: "emma.williams@enterprise.com",
    phone: "+1 (555) 456-7890",
    location: "New York, NY",
    leadScore: 65,
    scoreBreakdown: { intent: 70, budget: 60, timeline: 65, authority: 65 },
    tags: ["Feature Questions", "Enterprise"],
    activities: [
      { type: "message", content: "Asked about product features", time: "1 hour ago" },
      { type: "ai_response", content: "Provided feature overview", time: "45 minutes ago" }
    ],
    qualificationChecklist: [
      { item: "Budget confirmed", completed: false },
      { item: "Timeline discussed", completed: false },
      { item: "Decision maker identified", completed: true },
      { item: "Demo scheduled", completed: false }
    ]
  },
  {
    id: 4,
    name: "David Park",
    company: "Growth Inc",
    avatar: "DP",
    lastMessage: "Thanks for the information!",
    time: "2h",
    unread: false,
    status: "qualified",
    email: "david.park@growthinc.com",
    phone: "+1 (555) 321-0987",
    location: "Seattle, WA",
    leadScore: 80,
    scoreBreakdown: { intent: 85, budget: 80, timeline: 75, authority: 80 },
    tags: ["Qualified", "Growth Company"],
    activities: [
      { type: "message", content: "Positive response to demo", time: "2 hours ago" },
      { type: "qualification", content: "Lead fully qualified", time: "1.5 hours ago" }
    ],
    qualificationChecklist: [
      { item: "Budget confirmed", completed: true },
      { item: "Timeline discussed", completed: true },
      { item: "Decision maker identified", completed: true },
      { item: "Demo scheduled", completed: true }
    ]
  },
];

const messages = [
  { id: 1, sender: "lead", text: "Hi, I'm interested in your lead management solution", time: "10:23 AM" },
  {
    id: 2,
    sender: "ai",
    text: "Hello! I'd be happy to help. LeadFlow AI automates your inbound lead handling from WhatsApp and email. What's your biggest challenge with lead management right now?",
    time: "10:24 AM",
  },
  {
    id: 3,
    sender: "lead",
    text: "We're getting overwhelmed with inbound messages and missing follow-ups",
    time: "10:26 AM",
  },
  {
    id: 4,
    sender: "ai",
    text: "That's exactly what we solve. Our AI qualifies prospects automatically and schedules meetings directly. We integrate with your CRM to keep everything in sync. Would you like to see how it works?",
    time: "10:27 AM",
  },
  { id: 5, sender: "lead", text: "Yes, that sounds great. What's the next step?", time: "10:30 AM" },
  {
    id: 6,
    sender: "ai",
    text: "Perfect! I can schedule a 30-minute demo for you. Are you available this week? I have slots on Thursday at 2pm or Friday at 10am.",
    time: "10:31 AM",
  },
  { id: 7, sender: "lead", text: "That sounds perfect, I'd love to schedule a demo", time: "10:33 AM" },
];

export function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversationsData, setConversationsData] = useState(conversations);
  const [messagesData, setMessagesData] = useState(messages);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [humanTakeover, setHumanTakeover] = useState<{[key: number]: boolean}>({});

  // Filter conversations based on search term
  const filteredConversations = conversationsData.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messagesData.length + 1,
      sender: "lead" as const,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesData(prev => [...prev, userMessage]);
    setNewMessage("");

    // Mark conversation as read when sending a message
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, unread: false, lastMessage: newMessage, time: "now" }
          : conv
      )
    );

    // Generate AI response after a delay (only if not taken over by human)
    if (!humanTakeover[selectedConversation.id]) {
      setIsAIThinking(true);
      setTimeout(() => {
        generateAIResponse(newMessage);
      }, 1500 + Math.random() * 2000); // Random delay between 1.5-3.5 seconds
    } else {
      // Add a human agent response simulation
      setTimeout(() => {
        const humanResponse = {
          id: messagesData.length + 2,
          sender: "ai" as const, // Using 'ai' sender but indicating human
          text: "👋 Hi! I'm a human representative taking over this conversation. How can I help you today?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessagesData(prev => [...prev, humanResponse]);
      }, 1000);
    }
  };

  // Advanced AI response generation with context awareness
  const generateAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    const conversation = selectedConversation;
    const messageHistory = messagesData.slice(-6); // Last 6 messages for context

    let aiResponse = "";
    let shouldUpdateStatus = false;
    let newStatus = conversation.status;
    let qualificationUpdates = [];

    // Analyze conversation context
    const context = analyzeConversationContext(messageHistory, conversation);

    // Intent classification with confidence scores
    const intents = classifyIntent(lowerMessage, context);

    // Generate response based on primary intent
    const primaryIntent = intents[0];

    switch (primaryIntent.intent) {
      case 'pricing_inquiry':
        aiResponse = generatePricingResponse(context, conversation);
        break;

      case 'demo_request':
        aiResponse = generateDemoResponse(context, conversation);
        shouldUpdateStatus = true;
        newStatus = "booked";
        qualificationUpdates.push("Demo scheduled");
        break;

      case 'feature_question':
        aiResponse = generateFeatureResponse(lowerMessage, context);
        break;

      case 'integration_question':
        aiResponse = generateIntegrationResponse(context);
        break;

      case 'budget_concern':
        aiResponse = generateBudgetResponse(context, conversation);
        if (conversation.leadScore < 70) {
          shouldUpdateStatus = true;
          newStatus = "qualified";
        }
        break;

      case 'timeline_question':
        aiResponse = generateTimelineResponse(context);
        break;

      case 'objection':
        aiResponse = generateObjectionResponse(lowerMessage, context, conversation);
        break;

      case 'qualification':
        aiResponse = generateQualificationResponse(context, conversation);
        qualificationUpdates.push("Decision maker identified");
        break;

      case 'positive_response':
        aiResponse = generatePositiveResponse(context, conversation);
        break;

      case 'negative_response':
        aiResponse = generateNegativeResponse(context, conversation);
        shouldUpdateStatus = true;
        newStatus = "lost";
        break;

      default:
        aiResponse = generateContextualResponse(lowerMessage, context, conversation);
    }

    // Add follow-up questions based on conversation stage
    if (context.conversationStage === 'discovery') {
      aiResponse += generateDiscoveryFollowUp(context, conversation);
    } else if (context.conversationStage === 'consideration') {
      aiResponse += generateConsiderationFollowUp(context, conversation);
    } else if (context.conversationStage === 'decision') {
      aiResponse += generateDecisionFollowUp(context, conversation);
    }

    // Personalize based on lead score and company
    if (conversation.leadScore > 80) {
      aiResponse = personalizeForHighIntent(aiResponse, conversation);
    } else if (conversation.leadScore < 50) {
      aiResponse = personalizeForLowIntent(aiResponse, conversation);
    }

    const aiMessage = {
      id: messagesData.length + 2,
      sender: "ai" as const,
      text: aiResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesData(prev => [...prev, aiMessage]);
    setIsAIThinking(false);

    // Update conversation data
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversation.id
          ? {
              ...conv,
              lastMessage: aiResponse.length > 50 ? aiResponse.substring(0, 50) + "..." : aiResponse,
              time: "now",
              ...(shouldUpdateStatus && { status: newStatus }),
              activities: [
                {
                  type: "ai_response",
                  content: `AI: ${primaryIntent.intent.replace('_', ' ')} response`,
                  time: "just now"
                },
                ...(conv.activities || [])
              ].slice(0, 5)
            }
          : conv
      )
    );

    // Update qualification checklist
    if (qualificationUpdates.length > 0) {
      setConversationsData(prev =>
        prev.map(conv =>
          conv.id === conversation.id
            ? {
                ...conv,
                qualificationChecklist: conv.qualificationChecklist.map(item =>
                  qualificationUpdates.includes(item.item) ? { ...item, completed: true } : item
                )
              }
            : conv
        )
      );
    }
  };

  // Analyze conversation context for better responses
  const analyzeConversationContext = (messageHistory: any[], conversation: any) => {
    const context = {
      conversationStage: 'discovery', // discovery, consideration, decision
      painPoints: [],
      budgetDiscussed: false,
      timelineDiscussed: false,
      authorityIdentified: false,
      featuresMentioned: [],
      objectionsRaised: [],
      positiveSignals: 0,
      negativeSignals: 0
    };

    // Analyze message history
    messageHistory.forEach(msg => {
      const text = msg.text.toLowerCase();

      // Stage determination
      if (text.includes('pricing') || text.includes('cost') || text.includes('budget')) {
        context.budgetDiscussed = true;
        context.conversationStage = 'consideration';
      }
      if (text.includes('demo') || text.includes('schedule') || text.includes('meeting')) {
        context.conversationStage = 'decision';
      }

      // Pain points identification
      if (text.includes('overwhelm') || text.includes('too many') || text.includes('time')) {
        context.painPoints.push('lead volume');
      }
      if (text.includes('quality') || text.includes('qualified')) {
        context.painPoints.push('lead quality');
      }

      // Authority signals
      if (text.includes('decision') || text.includes('authority') || text.includes('cto') || text.includes('ceo')) {
        context.authorityIdentified = true;
      }

      // Sentiment analysis
      if (text.includes('great') || text.includes('excellent') || text.includes('perfect')) {
        context.positiveSignals++;
      }
      if (text.includes('concern') || text.includes('worry') || text.includes('expensive')) {
        context.negativeSignals++;
      }
    });

    return context;
  };

  // Classify user intent with confidence scores
  const classifyIntent = (message: string, context: any) => {
    const intents = [
      { intent: 'pricing_inquiry', confidence: 0, keywords: ['pricing', 'cost', 'price', 'fee', 'charge'] },
      { intent: 'demo_request', confidence: 0, keywords: ['demo', 'schedule', 'meeting', 'call', 'tour'] },
      { intent: 'feature_question', confidence: 0, keywords: ['feature', 'what', 'how', 'does', 'can'] },
      { intent: 'integration_question', confidence: 0, keywords: ['integrate', 'crm', 'connect', 'api', 'sync'] },
      { intent: 'budget_concern', confidence: 0, keywords: ['budget', 'afford', 'expensive', 'money', 'roi'] },
      { intent: 'timeline_question', confidence: 0, keywords: ['timeline', 'when', 'start', 'quick', 'fast'] },
      { intent: 'objection', confidence: 0, keywords: ['concern', 'worry', 'competitor', 'current', 'already'] },
      { intent: 'qualification', confidence: 0, keywords: ['decision', 'authority', 'team', 'process'] },
      { intent: 'positive_response', confidence: 0, keywords: ['great', 'excellent', 'perfect', 'love', 'interested'] },
      { intent: 'negative_response', confidence: 0, keywords: ['not interested', 'thanks', 'bye', 'no thanks'] }
    ];

    // Calculate confidence scores
    intents.forEach(intent => {
      intent.confidence = intent.keywords.reduce((score, keyword) => {
        return score + (message.includes(keyword) ? 1 : 0);
      }, 0) / intent.keywords.length;
    });

    // Sort by confidence
    return intents.sort((a, b) => b.confidence - a.confidence);
  };

  // Generate contextual responses for different intents
  const generatePricingResponse = (context: any, conversation: any) => {
    const baseResponse = "Our pricing is designed to scale with your business growth:";

    if (conversation.company.toLowerCase().includes('startup')) {
      return `${baseResponse} For startups like ${conversation.company}, our Growth plan at $79/month (billed annually) is perfect - includes 1,000 leads/month with full CRM integration.`;
    } else if (conversation.company.toLowerCase().includes('enterprise')) {
      return `${baseResponse} For enterprise organizations, our Enterprise plan starts at $299/month with unlimited leads, white-label options, and dedicated success management.`;
    } else {
      return `${baseResponse}
• Starter: $49/month (500 leads)
• Professional: $99/month (2,000 leads) 
• Enterprise: $299/month (unlimited)
All plans include 14-day free trial. Which size fits your current needs?`;
    }
  };

  const generateDemoResponse = (context: any, conversation: any) => {
    const timeSlots = ["Thursday 2pm", "Friday 10am", "Monday 3pm"];
    const randomSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    return `Perfect! I'd love to show you how LeadFlow AI can transform your lead management. I have availability ${randomSlot} - does that work for you? 

During the demo, I'll show you:
• Real-time lead qualification in action
• CRM integration setup
• Custom workflow automation
• ROI tracking and analytics

Should I send a calendar invite for ${randomSlot}?`;
  };

  const generateFeatureResponse = (message: string, context: any) => {
    if (message.includes('whatsapp') || message.includes('messaging')) {
      return "Our WhatsApp integration provides instant lead capture with AI-powered qualification. Leads are automatically scored and routed to your team based on intent, budget, and timeline. We also support SMS, email, and web forms.";
    } else if (message.includes('ai') || message.includes('automation')) {
      return "Our AI analyzes every lead interaction to determine intent level, budget readiness, and purchase timeline. It automatically schedules meetings, updates your CRM, and follows up based on lead behavior patterns.";
    } else {
      return "LeadFlow AI includes: AI-powered lead scoring, automated meeting scheduling, multi-channel integration (WhatsApp, email, web), CRM sync, detailed analytics, and custom workflow automation. Which feature interests you most?";
    }
  };

  const generateIntegrationResponse = (context: any) => {
    return "We integrate with all major CRMs: Salesforce, HubSpot, Pipedrive, Zoho, and 50+ others via native APIs. Setup takes just 5 minutes - you connect your API key, map fields, and you're live. We also support webhooks for custom integrations.";
  };

  const generateBudgetResponse = (context: any, conversation: any) => {
    const responses = [
      `Most clients see 3x ROI within 90 days through qualified leads and faster sales cycles. Our ${conversation.leadScore > 70 ? 'Professional' : 'Starter'} plan pays for itself with just 2-3 converted customers.`,
      "We offer flexible pricing and a 14-day free trial. The investment typically pays for itself within the first month through increased qualified leads and reduced manual qualification time.",
      `Based on ${conversation.company}'s size, you'd likely see a 200-300% ROI in the first quarter. We can provide a detailed ROI calculation during your demo.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateTimelineResponse = (context: any) => {
    return "You can be live in under 15 minutes! Our setup wizard guides you through: 1) CRM connection (2 mins), 2) Channel setup (5 mins), 3) AI training (5 mins), 4) Testing (3 mins). We provide 24/7 onboarding support.";
  };

  const generateObjectionResponse = (message: string, context: any, conversation: any) => {
    if (message.includes('competitor') || message.includes('current')) {
      return `I understand you're currently using another solution. What specifically do you like about your current tool? I'd love to show you how LeadFlow AI addresses those needs while providing better automation and insights.`;
    } else if (message.includes('expensive') || message.includes('cost')) {
      return `I completely understand budget considerations. Many clients find that LeadFlow AI actually reduces costs by eliminating manual lead qualification and follow-up work. The average client saves 15 hours/week while increasing qualified leads by 40%.`;
    } else {
      return "I appreciate you sharing your concerns. That's actually a common consideration for our clients. Let me address that specifically: [objection handling]. Would you like me to elaborate on how we handle this?";
    }
  };

  const generateQualificationResponse = (context: any, conversation: any) => {
    return `Thanks for sharing that context about your decision-making process. To ensure LeadFlow AI fits perfectly for ${conversation.company}, could you tell me:

• Who else is involved in the evaluation?
• What's your timeline for implementation?
• Are there any specific compliance or security requirements?

This helps me provide the most relevant information for your needs.`;
  };

  const generatePositiveResponse = (context: any, conversation: any) => {
    const responses = [
      `Excellent! I'm glad you're seeing the value in LeadFlow AI. Based on what you've shared about ${conversation.company}, I think our Professional plan would be a great fit for your needs.`,
      "That's fantastic feedback! Many companies in your situation have seen dramatic improvements in lead quality and sales velocity.",
      "I'm thrilled you're interested! Shall I schedule a demo to show you the platform in action?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateNegativeResponse = (context: any, conversation: any) => {
    return "I understand this might not be the right time for LeadFlow AI. Thank you for your interest and time. If your needs change in the future, we'd love to help. Have a great day!";
  };

  const generateContextualResponse = (message: string, context: any, conversation: any) => {
    const responses = [
      "That's a great question! Let me help you with that.",
      "I understand what you're looking for. Here's what I can tell you:",
      "Thanks for sharing that detail. Based on what you've told me, I recommend:",
      "I appreciate you providing that context. Here's how we can help:"
    ];

    let response = responses[Math.floor(Math.random() * responses.length)];

    // Add contextual follow-up
    if (context.painPoints.includes('lead volume')) {
      response += " It sounds like you're dealing with high lead volumes - our AI can help prioritize the most qualified prospects automatically.";
    } else if (context.painPoints.includes('lead quality')) {
      response += " Lead quality is crucial for sales success. Our AI scoring ensures you focus on prospects most likely to convert.";
    }

    return response;
  };

  // Generate follow-up questions based on conversation stage
  const generateDiscoveryFollowUp = (context: any, conversation: any) => {
    if (!context.budgetDiscussed) {
      return "\n\nTo better understand your needs, what's your monthly lead volume, and what's your biggest challenge with lead management right now?";
    } else if (!context.authorityIdentified) {
      return "\n\nCould you tell me a bit about your decision-making process and who else might be involved in evaluating solutions like LeadFlow AI?";
    } else {
      return "\n\nWould you be interested in seeing a quick demo of how LeadFlow AI works with leads similar to yours?";
    }
  };

  const generateConsiderationFollowUp = (context: any, conversation: any) => {
    return "\n\nBased on your requirements, I think our Professional plan would be a great fit. Would you like me to prepare a custom proposal, or shall I schedule a demo to show you exactly how it works?";
  };

  const generateDecisionFollowUp = (context: any, conversation: any) => {
    return "\n\nPerfect! Let's get you started. I've noted your requirements and can prepare everything for implementation. Should I send over the contract and onboarding materials?";
  };

  // Personalize responses based on lead score
  const personalizeForHighIntent = (response: string, conversation: any) => {
    return response.replace(
      "Would you like",
      `Given your strong interest in LeadFlow AI, would you like`
    );
  };

  const personalizeForLowIntent = (response: string, conversation: any) => {
    return response.replace(
      "Would you like",
      `To help you evaluate if LeadFlow AI is right for ${conversation.company}, would you like`
    );
  };

  // Handle marking conversation as read
  const markAsRead = (conversationId: number) => {
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, unread: false } : conv
      )
    );
  };

  // Handle archiving a conversation
  const archiveConversation = (conversationId: number) => {
    setConversationsData(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedConversation.id === conversationId) {
      const remaining = filteredConversations.filter(conv => conv.id !== conversationId);
      setSelectedConversation(remaining.length > 0 ? remaining[0] : conversationsData[0]);
    }
  };

  // Handle deleting a conversation
  const deleteConversation = (conversationId: number) => {
    setConversationsData(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedConversation.id === conversationId) {
      const remaining = filteredConversations.filter(conv => conv.id !== conversationId);
      setSelectedConversation(remaining.length > 0 ? remaining[0] : conversationsData[0]);
    }
  };

  // Handle adding a tag
  const addTag = (conversationId: number, tag: string) => {
    if (!tag.trim()) return;
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, tags: [...(conv.tags || []), tag.trim()] }
          : conv
      )
    );
    setNewTag("");
    setShowAddTag(false);
  };

  // Handle removing a tag
  const removeTag = (conversationId: number, tagToRemove: string) => {
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, tags: (conv.tags || []).filter(tag => tag !== tagToRemove) }
          : conv
      )
    );
  };

  // Handle updating qualification checklist
  const updateQualificationItem = (conversationId: number, itemIndex: number, completed: boolean) => {
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              qualificationChecklist: conv.qualificationChecklist.map((item, index) =>
                index === itemIndex ? { ...item, completed } : item
              )
            }
          : conv
      )
    );
  };

  // Handle taking over conversation from AI
  const takeOverConversation = (conversationId: number) => {
    // Mark conversation as taken over by human
    setHumanTakeover(prev => ({ ...prev, [conversationId]: true }));

    // Update conversation status and add activity
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              status: "active", // Reset to active for human handling
              activities: [
                {
                  type: "message",
                  content: "Human agent took over conversation",
                  time: "just now"
                },
                ...(conv.activities || [])
              ].slice(0, 5)
            }
          : conv
      )
    );

    // Add a system message to the chat
    const takeoverMessage = {
      id: messagesData.length + 1,
      sender: "ai" as const,
      text: "🔄 Conversation transferred to human agent. A representative will continue the conversation shortly.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesData(prev => [...prev, takeoverMessage]);

    // Update conversation last message
    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: "Human agent takeover initiated",
              time: "now"
            }
          : conv
      )
    );
  };

  // Handle releasing conversation back to AI
  const releaseToAI = (conversationId: number) => {
    setHumanTakeover(prev => ({ ...prev, [conversationId]: false }));

    setConversationsData(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              activities: [
                {
                  type: "message",
                  content: "Conversation released back to AI",
                  time: "just now"
                },
                ...(conv.activities || [])
              ].slice(0, 5)
            }
          : conv
      )
    );

    // Add a system message
    const releaseMessage = {
      id: messagesData.length + 1,
      sender: "ai" as const,
      text: "🔄 Conversation transferred back to AI assistant for continued support.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesData(prev => [...prev, releaseMessage]);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: typeof conversations[0]) => {
    setSelectedConversation(conversation);
    markAsRead(conversation.id);
  };

  return (
    <div className="flex h-screen" onClick={() => setShowDropdown(null)}>
      <div className="w-80 border-r border-border bg-background flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleConversationSelect(conv)}
              className={`w-full p-4 border-b border-border hover:bg-accent/50 transition-colors text-left ${
                selectedConversation.id === conv.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{conv.name}</p>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">{conv.company}</p>
                  <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              {selectedConversation.avatar}
            </div>
            <div>
              <p className="font-medium">{selectedConversation.name}</p>
              <p className="text-sm text-muted-foreground">{selectedConversation.company}</p>
              {humanTakeover[selectedConversation.id] && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 font-medium">Human Agent</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(showDropdown === selectedConversation.id ? null : selectedConversation.id);
              }}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showDropdown === selectedConversation.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-10"
              >
                <button
                  onClick={() => {
                    archiveConversation(selectedConversation.id);
                    setShowDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                >
                  <Archive className="w-4 h-4" />
                  Archive conversation
                </button>
                <button
                  onClick={() => {
                    deleteConversation(selectedConversation.id);
                    setShowDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messagesData.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === "lead" ? "" : "flex-row-reverse"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === "ai" && !humanTakeover[selectedConversation.id] ? "bg-blue-100 text-blue-600" :
                    msg.sender === "ai" && humanTakeover[selectedConversation.id] ? "bg-green-100 text-green-600" :
                    "bg-gray-200 text-gray-600"
                  }`}
                >
                  {msg.sender === "ai" && humanTakeover[selectedConversation.id] ? (
                    <User className="w-4 h-4" />
                  ) : msg.sender === "ai" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={`flex flex-col gap-1 max-w-md ${msg.sender === "lead" ? "items-start" : "items-end"}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.sender === "ai" && !humanTakeover[selectedConversation.id]
                        ? "bg-blue-600 text-white"
                        : msg.sender === "ai" && humanTakeover[selectedConversation.id]
                        ? "bg-green-600 text-white"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-2">{msg.time}</span>
                </div>
              </div>
            ))}

            {isAIThinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300" />
                </div>
                <span>AI is typing...</span>
              </div>
            )}
          </div>

          <div className="w-80 border-l border-border bg-background p-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-4">Lead Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedConversation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-blue-600 hover:underline cursor-pointer">{selectedConversation.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{selectedConversation.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p>{selectedConversation.company}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p>{selectedConversation.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p>WhatsApp</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3">Lead Score</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${selectedConversation.leadScore}%` }}
                    />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                    {selectedConversation.leadScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intent:</span>
                    <span className="font-medium">{selectedConversation.scoreBreakdown.intent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{selectedConversation.scoreBreakdown.budget}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{selectedConversation.scoreBreakdown.timeline}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authority:</span>
                    <span className="font-medium">{selectedConversation.scoreBreakdown.authority}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3">Status</h4>
              <div className="space-y-2">
                <select
                  value={selectedConversation.status}
                  onChange={(e) => updateLeadStatus(selectedConversation.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-input-background border border-border text-sm"
                >
                  <option value="active">Active</option>
                  <option value="qualified">Qualified</option>
                  <option value="booked">Booked</option>
                  <option value="lost">Lost</option>
                </select>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>
                    {selectedConversation.status === "qualified" && "Lead qualified"}
                    {selectedConversation.status === "booked" && "Meeting booked"}
                    {selectedConversation.status === "active" && "Conversation active"}
                    {selectedConversation.status === "lost" && "Lead lost"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Awaiting response</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4>Tags</h4>
                <button
                  onClick={() => setShowAddTag(!showAddTag)}
                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  + Add
                </button>
              </div>
              {showAddTag && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag(selectedConversation.id, newTag)}
                    placeholder="New tag..."
                    className="flex-1 px-2 py-1 text-sm rounded border border-border"
                  />
                  <button
                    onClick={() => addTag(selectedConversation.id, newTag)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(selectedConversation.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(selectedConversation.id, tag)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3">Qualification Checklist</h4>
              <div className="space-y-2">
                {selectedConversation.qualificationChecklist.map((item, index) => (
                  <label key={index} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => updateQualificationItem(selectedConversation.id, index, e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3">Recent Activity</h4>
              <div className="space-y-3">
                {selectedConversation.activities.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'message' ? 'bg-blue-500' :
                      activity.type === 'qualification' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-muted-foreground">{activity.content}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {humanTakeover[selectedConversation.id] ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-green-500 bg-green-50 text-green-700 cursor-not-allowed"
                >
                  ✓ Conversation Taken Over
                </button>
                <button
                  onClick={() => releaseToAI(selectedConversation.id)}
                  className="w-full px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Release to AI
                </button>
              </div>
            ) : (
              <button
                onClick={() => takeOverConversation(selectedConversation.id)}
                className="w-full px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Take over conversation
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-2 rounded-lg bg-input-background border border-border"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
