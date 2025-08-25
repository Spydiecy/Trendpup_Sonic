"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { IoSendSharp } from 'react-icons/io5';
import { FaDog, FaUser, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Image from 'next/image';

// Update DisplayData to be a string type
type DisplayData = string | null;

interface MessageWithAgent {
    type: "human" | "ai";
    content: string;
    id: string;
    agent?: string;
    finalReportWithCitations?: boolean;
}

interface AgentMessage {
    parts: { text: string }[];
    role: string;
}

interface AgentResponse {
    content: AgentMessage;
    usageMetadata: {
        candidatesTokenCount: number;
        promptTokenCount: number;
        totalTokenCount: number;
    };
    author: string;
    actions: {
        stateDelta: {
            research_plan?: string;
            final_report_with_citations?: boolean;
        };
    };
}

interface ProcessedEvent {
    title: string;
    data: any;
}

// Timeline Events Component with collapsible functionality
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

export default function TrendPupChat() {
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [appName, setAppName] = useState<string | null>(null);
    const [messages, setMessages] = useState<MessageWithAgent[]>([]);
    const [displayData, setDisplayData] = useState<DisplayData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [messageEvents, setMessageEvents] = useState<Map<string, ProcessedEvent[]>>(new Map());

    const [inputValue, setInputValue] = useState("");
    const [voiceMode, setVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const currentAgentRef = useRef('');
    const accumulatedTextRef = useRef("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const retryWithBackoff = async (
        fn: () => Promise<any>,
        maxRetries: number = 10,
        maxDuration: number = 120000 // 2 minutes
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
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
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



    // Function to extract text and metadata from SSE data
    const extractDataFromSSE = (data: string) => {
        try {
            const parsed = JSON.parse(data);
            console.log('[SSE PARSED EVENT]:', JSON.stringify(parsed, null, 2)); // DEBUG: Log parsed event

            let textParts: string[] = [];
            let agent = '';
            let finalReportWithCitations = undefined;
            let functionCall = null;
            let functionResponse = null;
            let sources = null;

            // Check if content.parts exists and has text
            if (parsed.content && parsed.content.parts) {
                textParts = parsed.content.parts
                    .filter((part: any) => part.text)
                    .map((part: any) => part.text);

                // Check for function calls
                const functionCallPart = parsed.content.parts.find((part: any) => part.functionCall);
                if (functionCallPart) {
                    functionCall = functionCallPart.functionCall;
                }

                // Check for function responses
                const functionResponsePart = parsed.content.parts.find((part: any) => part.functionResponse);
                if (functionResponsePart) {
                    functionResponse = functionResponsePart.functionResponse;
                }
            }

            // Extract agent information
            if (parsed.author) {
                agent = parsed.author;
                console.log('[SSE EXTRACT] Agent:', agent); // DEBUG: Log agent
            }

            if (
                parsed.actions &&
                parsed.actions.stateDelta &&
                parsed.actions.stateDelta.final_report_with_citations
            ) {
                finalReportWithCitations = parsed.actions.stateDelta.final_report_with_citations;
            }

            // Extract sources if available
            if (parsed.actions?.stateDelta?.sources) {
                sources = parsed.actions.stateDelta.sources;
                console.log('[SSE EXTRACT] Sources found:', sources); // DEBUG
            }

            return { textParts, agent, finalReportWithCitations, functionCall, functionResponse, sources };
        } catch (error) {
            // Log the error and a truncated version of the problematic data for easier debugging.
            const truncatedData = data.length > 200 ? data.substring(0, 200) + "..." : data;
            console.error('Error parsing SSE data. Raw data (truncated): "', truncatedData, '". Error details:', error);
            return { textParts: [], agent: '', finalReportWithCitations: undefined, functionCall: null, functionResponse: null, sources: null };
        }
    };

    // Define getEventTitle here or ensure it's in scope from where it's used
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

    const speakText = (text: string) => {
        if (!voiceMode || !synthRef.current) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const startListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser');
            return;
        }

        setIsListening(true);
        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const toggleVoiceMode = () => {
        const newVoiceMode = !voiceMode;
        setVoiceMode(newVoiceMode);

        if (!newVoiceMode && synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
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
            } else { // TrendPup agent text updates the main AI message
                for (const text of textParts) {
                    accumulatedTextRef.current += text + " ";
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, content: accumulatedTextRef.current.trim(), agent: currentAgentRef.current || msg.agent } : msg
                    ));
                    setDisplayData(accumulatedTextRef.current.trim());
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
            setMessages(prev => [...prev, { type: "ai", content: finalReportWithCitations as string, id: finalReportMessageId, agent: currentAgentRef.current, finalReportWithCitations: true }]);
            setDisplayData(finalReportWithCitations as string);
        }
    };

    const handleSubmit = useCallback(async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            // Create session if it doesn't exist
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

            // Add user message to chat
            const userMessageId = Date.now().toString();
            setMessages(prev => [...prev, { type: "human", content: query, id: userMessageId }]);

            // Create AI message placeholder
            const aiMessageId = Date.now().toString() + "_ai";
            currentAgentRef.current = ''; // Reset current agent
            accumulatedTextRef.current = ''; // Reset accumulated text

            setMessages(prev => [...prev, {
                type: "ai",
                content: "",
                id: aiMessageId,
                agent: '',
            }]);

            // Send the message with retry logic and timeout
            const sendMessage = async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

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
                                parts: [{ text: query }],
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

            // Handle SSE streaming with timeout
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let lineBuffer = "";
            let eventDataBuffer = "";
            let lastActivityTime = Date.now();
            const STREAM_TIMEOUT = 60000; // 60 seconds timeout

            if (reader) {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    // Add timeout check
                    if (Date.now() - lastActivityTime > STREAM_TIMEOUT) {
                        console.warn('[SSE TIMEOUT] Stream timed out after 60 seconds');
                        // Update the AI message with timeout error
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
                        lastActivityTime = Date.now(); // Reset timeout on activity
                    }

                    let eolIndex;
                    // Process all complete lines in the buffer, or the remaining buffer if 'done'
                    while ((eolIndex = lineBuffer.indexOf('\n')) >= 0 || (done && lineBuffer.length > 0)) {
                        let line: string;
                        if (eolIndex >= 0) {
                            line = lineBuffer.substring(0, eolIndex);
                            lineBuffer = lineBuffer.substring(eolIndex + 1);
                        } else { // Only if done and lineBuffer has content without a trailing newline
                            line = lineBuffer;
                            lineBuffer = "";
                        }

                        if (line.trim() === "") { // Empty line: dispatch event
                            if (eventDataBuffer.length > 0) {
                                // Remove trailing newline before parsing
                                const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
                                console.log('[SSE DISPATCH EVENT]:', jsonDataToParse.substring(0, 200) + "..."); // DEBUG
                                try {
                                    processSseEventData(jsonDataToParse, aiMessageId);
                                } catch (error) {
                                    console.error('[SSE PARSE ERROR]:', error);
                                    // Continue processing other events even if one fails
                                }
                                eventDataBuffer = ""; // Reset for next event
                            }
                        } else if (line.startsWith('data:')) {
                            eventDataBuffer += line.substring(5).trimStart() + '\n'; // Add newline as per spec for multi-line data
                        } else if (line.startsWith(':')) {
                            // Comment line, ignore
                        } else if (line.includes('error')) {
                            // Handle error lines
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
                        // If the loop exited due to 'done', and there's still data in eventDataBuffer
                        // (e.g., stream ended after data lines but before an empty line delimiter)
                        if (eventDataBuffer.length > 0) {
                            const jsonDataToParse = eventDataBuffer.endsWith('\n') ? eventDataBuffer.slice(0, -1) : eventDataBuffer;
                            console.log('[SSE DISPATCH FINAL EVENT]:', jsonDataToParse.substring(0, 200) + "..."); // DEBUG
                            try {
                                processSseEventData(jsonDataToParse, aiMessageId);
                            } catch (error) {
                                console.error('[SSE FINAL PARSE ERROR]:', error);
                            }
                            eventDataBuffer = ""; // Clear buffer
                        }
                        break; // Exit the while(true) loop
                    }
                }
            }

            // Ensure loading state is cleared even if no content was received
            if (accumulatedTextRef.current.trim() === "") {
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? {
                        ...msg,
                        content: "I'm having trouble processing that request right now. Please try again."
                    } : msg
                ));
            } else {
                // Speak the response if voice mode is enabled
                if (voiceMode && accumulatedTextRef.current.trim()) {
                    speakText(accumulatedTextRef.current.trim());
                }
            }

            setIsLoading(false);

        } catch (error) {
            console.error("Error:", error);

            // Create a new error message
            const errorMessageId = Date.now().toString() + "_ai_error";
            setMessages(prev => [...prev, {
                type: "ai",
                content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                id: errorMessageId
            }]);

            setIsLoading(false);
        }
    }, [userId, sessionId, appName]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // Initialize speech synthesis and recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;

            // Initialize speech recognition
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInputValue(transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };
            }
        }
    }, []);

    // Stop speaking when component unmounts
    useEffect(() => {
        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);
    const handleCancel = useCallback(() => {
        setMessages([]);
        setDisplayData(null);
        setMessageEvents(new Map());
        window.location.reload();
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            handleSubmit(inputValue.trim());
            setInputValue("");
        }
    };



    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-trendpup-dark to-trendpup-orange text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                            <Image
                                src="/trendpup-logo.png"
                                alt="TrendPup Logo"
                                width={32}
                                height={32}
                                className="rounded-full"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">TrendPup AI Assistant</h2>
                            <p className="text-sm opacity-90">Multi-chain memecoin intelligence with live trading</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleVoiceMode}
                            className={`p-2 rounded-lg transition-colors ${voiceMode
                                ? 'bg-trendpup-dark text-white'
                                : 'bg-trendpup-orange hover:bg-trendpup-dark text-white'
                                }`}
                            title={voiceMode ? 'Disable Voice Mode' : 'Enable Voice Mode'}
                        >
                            {voiceMode ? <FaVolumeUp className="text-lg" /> : <FaVolumeMute className="text-lg" />}
                        </button>
                        {isSpeaking && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-xs">Speaking...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
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
                        <h3 className="text-xl font-bold text-trendpup-dark mb-2">Welcome to TrendPup!</h3>
                        <p className="text-gray-600 mb-4">
                            Your AI-powered memecoin investment assistant for Kaia Network
                        </p>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p>• Get specific investment recommendations</p>
                            <p>• Check wallet balances across chains</p>
                            <p>• Execute trades and bridge tokens</p>
                            <p>• Real-time market analysis</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'human' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start max-w-[80%] ${message.type === 'human' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${message.type === 'human' ? 'bg-trendpup-orange ml-2' : 'bg-trendpup-dark mr-2'
                                    }`}>
                                    {message.type === 'human' ? (
                                        <FaUser className="text-white text-sm" />
                                    ) : (
                                        <FaDog className="text-white text-sm" />
                                    )}
                                </div>
                                <div className={`p-3 rounded-lg ${message.type === 'human'
                                    ? 'bg-trendpup-orange text-white'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {message.type === 'ai' && message.agent && (
                                        <div className="text-xs text-gray-500 mb-1">
                                            Agent: {message.agent}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{message.content}</div>

                                    {/* Show retry button for error messages */}
                                    {message.type === 'ai' && (message.content.includes('error') || message.content.includes('timeout') || message.content.includes('trouble')) && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => {
                                                    // Find the previous user message and retry it
                                                    const messageIndex = messages.findIndex(m => m.id === message.id);
                                                    if (messageIndex > 0) {
                                                        const previousMessage = messages[messageIndex - 1];
                                                        if (previousMessage.type === 'human') {
                                                            handleSubmit(previousMessage.content);
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

                                    {/* Show timeline events for this message */}
                                    {messageEvents.get(message.id) && messageEvents.get(message.id)!.length > 0 && (
                                        <TimelineEvents messageId={message.id} events={messageEvents.get(message.id)!} />
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
                                <span className="text-trendpup-dark font-medium">TrendPup is thinking...</span>
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
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
                <form onSubmit={handleFormSubmit} className="flex items-end space-x-2">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleFormSubmit(e);
                            }
                        }}
                        placeholder="Ask about memecoins, check balances, or get trading advice..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-trendpup-orange resize-none h-12 max-h-32 min-h-[3rem]"
                        disabled={isLoading}
                        rows={1}
                    />
                    <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                        className={`p-3 rounded-lg transition-colors ${isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                            : 'bg-trendpup-dark hover:bg-trendpup-orange text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                            }`}
                        title={isListening ? 'Stop Listening' : 'Voice Input'}
                    >
                        {isListening ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-3 bg-trendpup-orange text-white rounded-lg hover:bg-trendpup-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <IoSendSharp className="text-xl" />
                    </button>
                </form>
                {isListening && (
                    <div className="mt-2 flex items-center justify-center space-x-2 text-trendpup-orange">
                        <div className="w-2 h-2 bg-trendpup-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-trendpup-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-trendpup-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-sm">Listening...</span>
                    </div>
                )}
            </div>
        </div>
    );
}