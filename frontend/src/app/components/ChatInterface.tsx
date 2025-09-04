'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSendSharp, IoMicSharp, IoMicOffSharp } from 'react-icons/io5';
import { FaDog, FaUser, FaCube, FaChartLine, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface MessageWithAgent {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tab: 'mcp' | 'memecoins';
  id: string;
  agent?: string;
  finalReportWithCitations?: boolean;
}

interface ProcessedEvent {
  title: string;
  data: any;
}

interface ChatInterfaceProps {
  fullPage?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

function TimelineEvents({ messageId, events }: { messageId: string, events: ProcessedEvent[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = events.length > 4;
  const visibleEvents = shouldCollapse && !isExpanded ? events.slice(0, 4) : events;
  const hiddenCount = events.length - 4;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs text-gray-500 mb-2">Processing Timeline:</div>
      <div className="space-y-1">
        {visibleEvents.map((event, index) => (
          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
            <div className="font-medium">{event.title}</div>
            {event.data.type === 'functionCall' && (
              <div className="text-gray-600 mt-1">
                Calling: {event.data.name}
                {event.data.args && (
                  <div className="text-gray-500 text-xs mt-1">
                    Args: {JSON.stringify(event.data.args).substring(0, 100)}
                    {JSON.stringify(event.data.args).length > 100 && '...'}
                  </div>
                )}
              </div>
            )}
            {event.data.type === 'functionResponse' && (
              <div className="text-gray-600 mt-1">
                Response from: {event.data.name}
                {event.data.response && typeof event.data.response === 'object' && event.data.response.result && (
                  <div className="text-gray-500 text-xs mt-1 max-h-20 overflow-y-auto">
                    {event.data.response.result.substring(0, 200)}
                    {event.data.response.result.length > 200 && '...'}
                  </div>
                )}
              </div>
            )}
            {event.data.type === 'text' && (
              <div className="text-gray-600 mt-1">
                {event.data.content.substring(0, 150)}
                {event.data.content.length > 150 && '...'}
              </div>
            )}
            {event.data.type === 'sources' && (
              <div className="text-gray-600 mt-1">
                <div className="font-medium">Sources Retrieved:</div>
                {Object.entries(event.data.content).slice(0, 3).map(([key, source]: [string, any]) => (
                  <div key={key} className="text-xs mt-1">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {source.title || source.domain}
                    </a>
                  </div>
                ))}
                {Object.keys(event.data.content).length > 3 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{Object.keys(event.data.content).length - 3} more sources
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {shouldCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
          >
            {isExpanded
              ? '▲ Show less'
              : `▼ Show ${hiddenCount} more events`
            }
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface({ fullPage = false }: ChatInterfaceProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<MessageWithAgent[]>([]);
  const [messageEvents, setMessageEvents] = useState<Map<string, ProcessedEvent[]>>(new Map());
  const [activeTab, setActiveTab] = useState<'mcp' | 'memecoins'>('memecoins');
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentAgentRef = useRef('');
  const accumulatedTextRef = useRef("");

  const filteredMessages = messages.filter(msg => msg.tab === activeTab);

  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = 10,
    maxDuration: number = 120000
  ): Promise<any> => {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (Date.now() - startTime > maxDuration) {
        throw new Error(`Retry timeout after ${maxDuration}ms`);
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  };

  const createSession = async (): Promise<{ userId: string, sessionId: string, appName: string }> => {
    const generatedSessionId = uuidv4();
    const response = await fetch(`/api/apps/app/users/u_999/sessions/${generatedSessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      userId: data.userId,
      sessionId: data.id,
      appName: data.appName
    };
  };

  const extractDataFromSSE = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      console.log('[SSE PARSED EVENT]:', JSON.stringify(parsed, null, 2));

      let textParts: string[] = [];
      let agent = '';
      let finalReportWithCitations = undefined;
      let functionCall = null;
      let functionResponse = null;
      let sources = null;

      if (parsed.content && parsed.content.parts) {
        textParts = parsed.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text);

        const functionCallPart = parsed.content.parts.find((part: any) => part.functionCall);
        if (functionCallPart) {
          functionCall = functionCallPart.functionCall;
        }

        const functionResponsePart = parsed.content.parts.find((part: any) => part.functionResponse);
        if (functionResponsePart) {
          functionResponse = functionResponsePart.functionResponse;
        }
      }

      if (parsed.author) {
        agent = parsed.author;
        console.log('[SSE EXTRACT] Agent:', agent);
      }

      if (
        parsed.actions &&
        parsed.actions.stateDelta &&
        parsed.actions.stateDelta.final_report_with_citations
      ) {
        finalReportWithCitations = parsed.actions.stateDelta.final_report_with_citations;
      }

      if (parsed.actions?.stateDelta?.sources) {
        sources = parsed.actions.stateDelta.sources;
        console.log('[SSE EXTRACT] Sources found:', sources);
      }

      return { textParts, agent, finalReportWithCitations, functionCall, functionResponse, sources };
    } catch (error) {
      const truncatedData = data.length > 200 ? data.substring(0, 200) + "..." : data;
      console.error('Error parsing SSE data. Raw data (truncated): "', truncatedData, '". Error details:', error);
      return { textParts: [], agent: '', finalReportWithCitations: undefined, functionCall: null, functionResponse: null, sources: null };
    }
  };

  const getEventTitle = (agentName: string): string => {
    switch (agentName) {
      case "README_Context":
        return "Loading Context";
      case "Google_Search":
        return "Searching Market Data";
      case "OKX_MCP":
        return "Analyzing Blockchain Data";
      case "TrendPup":
        return "Generating Recommendations";
      default:
        return `Processing (${agentName || 'Unknown Agent'})`;
    }
  };

  const processSseEventData = (jsonData: string, aiMessageId: string) => {
    const { textParts, agent, finalReportWithCitations, functionCall, functionResponse, sources } = extractDataFromSSE(jsonData);

    if (agent && agent !== currentAgentRef.current) {
      currentAgentRef.current = agent;
    }

    if (functionCall) {
      const functionCallTitle = `Function Call: ${functionCall.name}`;
      console.log('[SSE HANDLER] Adding Function Call timeline event:', functionCallTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionCallTitle,
        data: { type: 'functionCall', name: functionCall.name, args: functionCall.args, id: functionCall.id }
      }]));
    }

    if (functionResponse) {
      const functionResponseTitle = `Function Response: ${functionResponse.name}`;
      console.log('[SSE HANDLER] Adding Function Response timeline event:', functionResponseTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionResponseTitle,
        data: { type: 'functionResponse', name: functionResponse.name, response: functionResponse.response, id: functionResponse.id }
      }]));
    }

    if (textParts.length > 0) {
      if (agent !== "TrendPup") {
        const eventTitle = getEventTitle(agent);
        console.log('[SSE HANDLER] Adding Text timeline event for agent:', agent, 'Title:', eventTitle, 'Data:', textParts.join(" "));
        setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
          title: eventTitle,
          data: { type: 'text', content: textParts.join(" ") }
        }]));
      } else {
        for (const text of textParts) {
          accumulatedTextRef.current += text + " ";
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, content: accumulatedTextRef.current.trim(), agent: currentAgentRef.current || msg.agent } : msg
          ));
        }
      }
    }

    if (sources) {
      console.log('[SSE HANDLER] Adding Retrieved Sources timeline event:', sources);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: "Retrieved Sources", data: { type: 'sources', content: sources }
      }]));
    }

    if (finalReportWithCitations) {
      const finalReportMessageId = Date.now().toString() + "_final";
      setMessages(prev => [...prev, { 
        type: "assistant", 
        content: finalReportWithCitations as string, 
        id: finalReportMessageId, 
        agent: currentAgentRef.current, 
        finalReportWithCitations: true,
        timestamp: new Date(),
        tab: activeTab
      }]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          inputRef.current?.focus();
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event);
          setIsListening(false);
        };

        setRecognition(recognition);
      }

      if (window.speechSynthesis) {
        setSynthesis(window.speechSynthesis);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVoiceInput = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const speakText = (text: string) => {
    if (synthesis && voiceEnabled && text.trim()) {
      synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      const voices = synthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Google US English')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      synthesis.speak(utterance);
    }
  };

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      let currentUserId = userId;
      let currentSessionId = sessionId;
      let currentAppName = appName;

      if (!currentSessionId || !currentUserId || !currentAppName) {
        console.log('Creating new session...');
        const sessionData = await retryWithBackoff(createSession);
        currentUserId = sessionData.userId;
        currentSessionId = sessionData.sessionId;
        currentAppName = sessionData.appName;

        setUserId(currentUserId);
        setSessionId(currentSessionId);
        setAppName(currentAppName);
        console.log('Session created successfully:', { currentUserId, currentSessionId, currentAppName });
      }

      const userMessageId = Date.now().toString();
      setMessages(prev => [...prev, { 
        type: "user", 
        content: query,
        id: userMessageId,
        timestamp: new Date(),
        tab: activeTab
      }]);

      const aiMessageId = Date.now().toString() + "_ai";
      currentAgentRef.current = '';
      accumulatedTextRef.current = '';

      setMessages(prev => [...prev, {
        type: "assistant",
        content: "",
        id: aiMessageId,
        agent: '',
        timestamp: new Date(),
        tab: activeTab
      }]);

      const contextualQuery = activeTab === 'mcp' 
        ? `[MCP CALL] ${query}` 
        : `[ANALYZE CALL] ${query}`;

      console.log(`[BACKEND CONTEXT INJECTION] Sending query with context: ${contextualQuery}`);

      const sendMessage = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const response = await fetch("/api/run_sse", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appName: currentAppName,
              userId: currentUserId,
              sessionId: currentSessionId,
              newMessage: {
                parts: [{ text: contextualQuery }],
                role: "user"
              },
              streaming: false
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
          }

          return response;
        } catch (error: unknown) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out after 2 minutes');
          }
          throw error;
        }
      };

      const response = await retryWithBackoff(sendMessage);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let eventDataBuffer = "";
      let lastActivityTime = Date.now();
      const STREAM_TIMEOUT = 60000;

      if (reader) {
        while (true) {
          if (Date.now() - lastActivityTime > STREAM_TIMEOUT) {
            console.warn('[SSE TIMEOUT] Stream timed out after 60 seconds');
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId ? {
                ...msg,
                content: msg.content || "Sorry, the response timed out. Please try again."
              } : msg
            ));
            break;
          }

          const { done, value } = await reader.read();

          if (value) {
            lineBuffer += decoder.decode(value, { stream: true });
            lastActivityTime = Date.now();
          }

          let eolIndex;
          while ((eolIndex = lineBuffer.indexOf('\n')) >= 0 || (done && lineBuffer.length > 0)) {
            let line: string;
            if (eolIndex >= 0) {
              line = lineBuffer.substring(0, eolIndex);
              lineBuffer = lineBuffer.substring(eolIndex + 1);
            } else {
              line = lineBuffer;
              lineBuffer = "";
            }

            if (line.trim() === "") {
              if (eventDataBuffer.length > 0) {
                const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
                console.log('[SSE DISPATCH EVENT]:', jsonDataToParse.substring(0, 200) + "...");
                try {
                  processSseEventData(jsonDataToParse, aiMessageId);
                } catch (error) {
                  console.error('[SSE PARSE ERROR]:', error);
                }
                eventDataBuffer = "";
              }
            } else if (line.startsWith('data:')) {
              eventDataBuffer += line.substring(5).trimStart() + '\n';
            } else if (line.startsWith(':')) {
              
            } else if (line.includes('error')) {
              console.error('[SSE ERROR LINE]:', line);
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId ? {
                  ...msg,
                  content: msg.content || "An error occurred while processing your request. Please try again."
                } : msg
              ));
            }
          }

          if (done) {
            if (eventDataBuffer.length > 0) {
              const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
              console.log('[SSE DISPATCH FINAL EVENT]:', jsonDataToParse.substring(0, 200) + "...");
              try {
                processSseEventData(jsonDataToParse, aiMessageId);
              } catch (error) {
                console.error('[SSE FINAL PARSE ERROR]:', error);
              }
              eventDataBuffer = "";
            }
            break;
          }
        }
      }

      if (accumulatedTextRef.current.trim() === "") {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? {
            ...msg,
            content: "I'm having trouble processing that request right now. Please try again."
          } : msg
        ));
      } else {
        if (voiceEnabled && accumulatedTextRef.current.trim()) {
          speakText(accumulatedTextRef.current.trim());
        }
      }

      setIsLoading(false);

    } catch (error) {
      console.error("Error:", error);

      const errorMessageId = Date.now().toString() + "_ai_error";
      setMessages(prev => [...prev, {
        type: "assistant",
        content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        id: errorMessageId,
        timestamp: new Date(),
        tab: activeTab
      }]);

      setIsLoading(false);
    }
  }, [userId, sessionId, appName, activeTab, voiceEnabled]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput('');
    inputRef.current?.focus();
    
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full flex-1 min-h-0 w-full max-w-4xl mx-auto rounded-xl shadow-xl overflow-hidden border border-trendpup-brown/20 bg-white`}>
      {!fullPage && (
        <div className="bg-trendpup-dark text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={32} 
                height={32}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold">TrendPup Assistant</h1>
              <p className="text-sm opacity-75">
                {isConnected ? `Connected - ${activeTab === 'mcp' ? 'MCP Protocol Mode' : 'Memecoin Analysis Mode'}` : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled 
                ? 'bg-trendpup-orange hover:bg-orange-600' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
          >
            {voiceEnabled ? (
              <HiSpeakerWave className="text-xl" />
            ) : (
              <HiSpeakerXMark className="text-xl" />
            )}
          </button>
        </div>
      )}

      <div className="bg-gray-100 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('memecoins')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'memecoins'
                ? 'bg-white text-trendpup-orange border-b-2 border-trendpup-orange'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaChartLine />
            Memecoins
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'mcp'
                ? 'bg-white text-trendpup-orange border-b-2 border-trendpup-orange'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaCube />
            MCP Protocol
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-trendpup-light">
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <Image
                  src="/trendpup-logo.png"
                  alt="TrendPup Logo"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
              <h3 className="text-xl font-bold text-trendpup-dark mb-2">
                Welcome to TrendPup {activeTab === 'mcp' ? 'MCP Protocol' : 'Memecoins'}!
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'mcp' 
                  ? 'Your AI-powered blockchain data assistant for DuckChain Network'
                  : 'Your AI-powered memecoin investment assistant for DuckChain Network'
                }
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                {activeTab === 'mcp' ? (
                  <>
                    <p>🔍 Check wallet balances across chains</p>
                    <p>📊 Analyze smart contracts</p>
                    <p>⚡ Monitor blockchain transactions</p>
                    <p>🌐 Real-time protocol data</p>
                  </>
                ) : (
                  <>
                    <p>🎯 Get specific investment recommendations</p>
                    <p>📈 Track trending memecoins</p>
                    <p>🔥 Real-time market analysis</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}> 
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-trendpup-orange ml-2' : 'bg-trendpup-brown mr-2'
                  }`}>
                    {msg.type === 'user' ? (
                      <FaUser className="text-white text-sm" />
                    ) : (
                      <FaDog className="text-white text-sm" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-trendpup-orange text-white'
                        : 'bg-white text-trendpup-dark border border-trendpup-brown/20'
                    }`}
                  >
                    {msg.type === 'assistant' && msg.agent && (
                      <div className="text-xs text-gray-500 mb-1">
                        Agent: {msg.agent}
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {formatTimestamp(msg.timestamp)}
                    </span>

                    {msg.type === 'assistant' && (msg.content.includes('error') || msg.content.includes('timeout') || msg.content.includes('trouble')) && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            const messageIndex = messages.findIndex(m => m.id === msg.id);
                            if (messageIndex > 0) {
                              const previousMessage = messages[messageIndex - 1];
                              if (previousMessage.type === 'user') {
                                sendMessage(previousMessage.content);
                              }
                            }
                          }}
                          className="text-xs bg-trendpup-orange hover:bg-trendpup-dark text-white px-3 py-1 rounded transition-colors"
                          disabled={isLoading}
                        >
                          🔄 Retry
                        </button>
                      </div>
                    )}

                    {messageEvents.get(msg.id) && messageEvents.get(msg.id)!.length > 0 && (
                      <TimelineEvents messageId={msg.id} events={messageEvents.get(msg.id)!} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-center my-4">
              <div className="bg-trendpup-orange/10 border border-trendpup-orange/20 px-4 py-2 rounded-full">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-trendpup-orange"></div>
                  <span className="text-trendpup-dark font-medium">
                    TrendPup is {activeTab === 'mcp' ? 'checking blockchain data' : 'analyzing memecoins'}...
                  </span>
                  <button
                    onClick={() => {
                      setIsLoading(false);
                      setMessages(prev => prev.map(msg =>
                        msg.content === "" ? { ...msg, content: "Request cancelled by user." } : msg
                      ));
                    }}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-trendpup-brown/10">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              activeTab === 'mcp' 
                ? "Ask about blockchain data, balances, or smart contracts..." 
                : "Ask about memecoins, trends, or market insights..."
            }
            disabled={!isConnected || isLoading}
            className="flex-1 p-3 border border-trendpup-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-trendpup-orange resize-none h-12 max-h-32 min-h-[3rem]"
            rows={1}
          />
          
          {recognition && (
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={!isConnected || isLoading}
              className={`p-3 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white disabled:bg-gray-400 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? (
                <IoMicOffSharp className="text-xl" />
              ) : (
                <IoMicSharp className="text-xl" />
              )}
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!isConnected || !input.trim() || isLoading}
            className="p-3 bg-trendpup-orange text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <IoSendSharp className="text-xl" />
          </button>
        </div>
        
        {isListening && (
          <div className="mt-2 text-sm text-red-600 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            Listening... Speak now
          </div>
        )}
      </div>
    </div>
  );
}