import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Send, Bot, User, Sparkles, Database, Code, Workflow } from 'lucide-react-native';
import { useAuth } from '@/providers/auth-provider';
import { fetchSalesforceObjects, fetchObjectFields } from '@/services/salesforce';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

interface SalesforceContext {
  objects: {
    name: string;
    label: string;
    custom: boolean;
  }[];
  instanceUrl: string;
  isConnected: boolean;
}

export default function AssistantScreen() {
  const { instanceUrl, accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Salesforce AI Assistant. I can help you understand your org's metadata, relationships between objects, and answer questions about your Salesforce configuration. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [salesforceContext, setSalesforceContext] = useState<SalesforceContext>({
    objects: [],
    instanceUrl: instanceUrl || '',
    isConnected: !!accessToken,
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const loadSalesforceContext = React.useCallback(async () => {
    if (!instanceUrl || !accessToken) {
      setSalesforceContext({
        objects: [],
        instanceUrl: '',
        isConnected: false,
      });
      return;
    }

    try {
      console.log('Loading Salesforce context for AI Assistant...');
      const objects = await fetchSalesforceObjects(instanceUrl, accessToken);
      setSalesforceContext({
        objects: objects, // Load all objects for comprehensive analysis
        instanceUrl,
        isConnected: true,
      });
      console.log(`Loaded ${objects.length} objects for AI context`);
    } catch (error) {
      console.error('Failed to load Salesforce context:', error);
      setSalesforceContext({
        objects: [],
        instanceUrl: instanceUrl || '',
        isConnected: false,
      });
    }
  }, [instanceUrl, accessToken]);

  // Load Salesforce context when component mounts
  useEffect(() => {
    loadSalesforceContext();
  }, [loadSalesforceContext]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Analyzing your Salesforce org metadata...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Analyze the user's question to determine what metadata to fetch
      const questionLower = userMessage.text.toLowerCase();
      let relevantMetadata: any = {};
      let detailedContext = '';

      // Enhanced metadata fetching based on question type
      const isRelationshipQuestion = questionLower.includes('relationship') || questionLower.includes('related') || 
          questionLower.includes('connection') || questionLower.includes('between');
      
      const isObjectAnalysisQuestion = questionLower.includes('object') || questionLower.includes('field') || 
          questionLower.includes('custom') || questionLower.includes('standard') || questionLower.includes('analyze');

      // Extract object names from the question with better matching
      const extractObjectNames = (question: string): string[] => {
        const foundObjects: string[] = [];
        const words = question.toLowerCase().split(/\s+/);
        
        for (const obj of salesforceContext.objects) {
          const objNameLower = obj.name.toLowerCase();
          const objLabelLower = obj.label.toLowerCase();
          
          // Check for exact matches first
          if (words.includes(objNameLower) || words.includes(objLabelLower)) {
            foundObjects.push(obj.name);
            continue;
          }
          
          // Check for partial matches in the full question
          if (question.includes(objNameLower) || question.includes(objLabelLower)) {
            foundObjects.push(obj.name);
            continue;
          }
          
          // Check for common variations (remove underscores, spaces)
          const normalizedObjName = objNameLower.replace(/[_\s]/g, '');
          const normalizedQuestion = question.replace(/[_\s]/g, '');
          if (normalizedObjName.length > 3 && normalizedQuestion.includes(normalizedObjName)) {
            foundObjects.push(obj.name);
          }
        }
        
        return [...new Set(foundObjects)]; // Remove duplicates
      };
      
      const objectNames = extractObjectNames(questionLower);
      console.log('Extracted object names from question:', objectNames);

      // Fetch comprehensive metadata for relationship questions
      if ((isRelationshipQuestion || isObjectAnalysisQuestion) && instanceUrl && accessToken) {
        console.log('Fetching comprehensive metadata for analysis...');
        
        // If specific objects mentioned, fetch their details
        if (objectNames.length > 0) {
          for (const objName of objectNames) {
            try {
              console.log(`Fetching detailed metadata for: ${objName}`);
              const fields = await fetchObjectFields(instanceUrl, accessToken, objName);
              
              // Find relationship fields
              const relationshipFields = fields.filter(f => 
                f.type === 'reference' || f.relationshipName || (f.referenceTo && f.referenceTo.length > 0)
              );
              
              // Get child relationships from the describe call
              const childRelationships = fields.flatMap(f => f.childRelationships || []);
              
              relevantMetadata[objName] = {
                totalFields: fields.length,
                relationshipFields: relationshipFields.map(f => ({
                  name: f.name,
                  label: f.label,
                  type: f.type,
                  referenceTo: f.referenceTo,
                  relationshipName: f.relationshipName,
                  required: f.required,
                })),
                childRelationships: childRelationships,
                allFields: fields.slice(0, 20).map(f => ({ // Include some key fields for context
                  name: f.name,
                  label: f.label,
                  type: f.type,
                  custom: f.custom,
                  required: f.required
                }))
              };
              
              // Build detailed context
              detailedContext += `\n\n=== OBJECT: ${objName} ===\n`;
              detailedContext += `Label: ${salesforceContext.objects.find(o => o.name === objName)?.label || objName}\n`;
              detailedContext += `Total Fields: ${fields.length}\n`;
              detailedContext += `Custom Object: ${salesforceContext.objects.find(o => o.name === objName)?.custom ? 'Yes' : 'No'}\n`;
              
              if (relationshipFields.length > 0) {
                detailedContext += `\nRELATIONSHIP FIELDS (${relationshipFields.length}):\n`;
                relationshipFields.forEach(f => {
                  if (f.referenceTo && f.referenceTo.length > 0) {
                    detailedContext += `- ${f.label} (${f.name}): References ${f.referenceTo.join(', ')}${f.required ? ' [Required]' : ''}${f.relationshipName ? ` [Relationship: ${f.relationshipName}]` : ''}\n`;
                  }
                });
              }
              
              if (childRelationships.length > 0) {
                detailedContext += `\nCHILD RELATIONSHIPS (${childRelationships.length}):\n`;
                childRelationships.forEach(rel => {
                  detailedContext += `- ${rel.childSObject} via ${rel.field} (${rel.relationshipName || 'N/A'})\n`;
                });
              }
              
              // Add key fields for context
              const keyFields = fields.filter(f => 
                f.name.toLowerCase().includes('name') || 
                f.name.toLowerCase().includes('id') || 
                f.type === 'reference' ||
                f.custom
              ).slice(0, 10);
              
              if (keyFields.length > 0) {
                detailedContext += `\nKEY FIELDS (showing ${keyFields.length}):\n`;
                keyFields.forEach(f => {
                  detailedContext += `- ${f.label} (${f.name}): ${f.type}${f.custom ? ' [Custom]' : ''}${f.required ? ' [Required]' : ''}\n`;
                });
              }
              
            } catch (error) {
              console.error(`Failed to fetch fields for ${objName}:`, error);
              detailedContext += `\n\nERROR: Could not fetch metadata for ${objName}: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
            }
          }
        } else if (isRelationshipQuestion) {
          // If no specific objects mentioned but it's a relationship question, 
          // provide general relationship information from available objects
          detailedContext += `\n\nGENERAL RELATIONSHIP ANALYSIS:\n`;
          detailedContext += `Available objects in your org: ${salesforceContext.objects.length}\n`;
          
          // Show some common objects that might be relevant
          const commonObjects = salesforceContext.objects.filter(obj => 
            ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Task', 'Event'].includes(obj.name) ||
            obj.custom
          ).slice(0, 15);
          
          if (commonObjects.length > 0) {
            detailedContext += `\nCommon/Custom objects available:\n`;
            commonObjects.forEach(obj => {
              detailedContext += `- ${obj.label} (${obj.name})${obj.custom ? ' [Custom]' : ' [Standard]'}\n`;
            });
            detailedContext += `\nTo get specific relationship details, please mention the object names in your question.\n`;
          }
        }
      }
      
      // Check if the question is about specific fields or objects
      if (questionLower.includes('field') || questionLower.includes('object') || 
          questionLower.includes('custom') || questionLower.includes('standard')) {
        
        // Add general object information
        const customObjects = salesforceContext.objects.filter(o => o.custom);
        const standardObjects = salesforceContext.objects.filter(o => !o.custom);
        
        detailedContext += `\n\nOrg Overview:\n`;
        detailedContext += `- Total Objects: ${salesforceContext.objects.length}\n`;
        detailedContext += `- Standard Objects: ${standardObjects.length}\n`;
        detailedContext += `- Custom Objects: ${customObjects.length}\n`;
        
        if (customObjects.length > 0) {
          detailedContext += `\nCustom Objects: ${customObjects.slice(0, 10).map(o => o.label).join(', ')}${customObjects.length > 10 ? '...' : ''}\n`;
        }
      }

      // Create enhanced system message with actual metadata
      const systemMessage = `You are a Salesforce AI Assistant with direct access to the user's org metadata. 

IMPORTANT: You must analyze and use the actual metadata provided below to answer questions accurately. Do not give generic Salesforce advice - use the specific metadata from their org.

Connected Org Information:
- Instance URL: ${salesforceContext.instanceUrl}
- Total Objects: ${salesforceContext.objects.length}
- Connection Status: ${salesforceContext.isConnected ? 'Active' : 'Not Connected'}

${detailedContext ? 'ACTUAL METADATA FROM THE ORG:' + detailedContext : ''}

Available Objects in the Org (${salesforceContext.objects.length} total):
${salesforceContext.objects.slice(0, 50).map(obj => `- ${obj.label} (${obj.name})${obj.custom ? ' [Custom]' : ''}`).join('\n')}
${salesforceContext.objects.length > 50 ? `... and ${salesforceContext.objects.length - 50} more objects` : ''}

Instructions:
1. CRITICAL: Always use the actual metadata provided above, not generic Salesforce knowledge
2. When asked about relationships between objects, analyze the RELATIONSHIP FIELDS and CHILD RELATIONSHIPS sections
3. Be specific and reference actual field names, object names, and relationship names from the metadata
4. If relationship data is provided, explain the exact connections (lookup, master-detail, etc.)
5. If no specific objects were mentioned, ask the user to specify which objects they want to analyze
6. If metadata wasn't fetched for requested objects, explain that and suggest using the Objects tab
7. Always cite the specific field names and relationship types when explaining connections
8. For custom objects, note that they are custom and explain their purpose if apparent from the metadata

Formatting Requirements:
- Use markdown formatting for better readability
- Use headers (# ## ###) to organize sections
- Use bullet points (- ) for lists
- Use numbered lists (1. 2. 3.) for sequential steps
- Use **bold** for emphasis on important terms
- Use backticks for inline code for field names, API names, and technical terms
- Use code blocks with triple backticks for longer code examples
- Organize information into clear sections with descriptive headers
- Add line breaks between sections for better visual separation`;

      // Call the AI API with enhanced context
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage.text },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.completion || 'Sorry, I couldn\'t generate a response.';

      // Replace loading message with actual response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, text: aiResponse, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error('AI Assistant error:', error);
      
      // Replace loading message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { 
                ...msg, 
                text: 'Sorry, I encountered an error while processing your request. Please try again.', 
                isLoading: false 
              }
            : msg
        )
      );
      
      Alert.alert(
        'Error',
        'Failed to get AI response. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatAIResponse = (text: string) => {
    const elements: React.ReactNode[] = [];
    let key = 0;

    // Split text into lines for processing
    const lines = text.split('\n');
    let currentList: string[] = [];
    let currentListType: 'bullet' | 'numbered' | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    const flushList = () => {
      if (currentList.length > 0 && currentListType) {
        elements.push(
          <View key={key++} style={styles.listContainer}>
            {currentList.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>
                  {currentListType === 'bullet' ? '•' : `${index + 1}.`}
                </Text>
                <Text style={styles.listText}>{formatInlineText(item)}</Text>
              </View>
            ))}
          </View>
        );
        currentList = [];
        currentListType = null;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <View key={key++} style={styles.codeBlock}>
            {codeBlockLang && (
              <Text style={styles.codeBlockLang}>{codeBlockLang}</Text>
            )}
            <Text style={styles.codeBlockText}>
              {codeBlockContent.join('\n')}
            </Text>
          </View>
        );
        codeBlockContent = [];
        codeBlockLang = '';
        inCodeBlock = false;
      }
    };

    // Helper function to format inline text with bold and code
    const formatInlineText = (text: string): React.ReactNode => {
      if (!text.includes('**') && !text.includes('`')) {
        return text;
      }

      const parts: React.ReactNode[] = [];
      let remaining = text;
      let partKey = 0;

      while (remaining.length > 0) {
        // Find the next markdown element
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        
        let nextMatch = null;
        let matchType = '';
        let matchIndex = Infinity;
        
        if (boldMatch && boldMatch.index !== undefined && boldMatch.index < matchIndex) {
          nextMatch = boldMatch;
          matchType = 'bold';
          matchIndex = boldMatch.index;
        }
        
        if (codeMatch && codeMatch.index !== undefined && codeMatch.index < matchIndex) {
          nextMatch = codeMatch;
          matchType = 'code';
          matchIndex = codeMatch.index;
        }
        
        if (nextMatch && nextMatch.index !== undefined) {
          // Add text before the match
          if (nextMatch.index > 0) {
            parts.push(remaining.substring(0, nextMatch.index));
          }
          
          // Add the formatted match
          if (matchType === 'bold') {
            parts.push(
              <Text key={`bold-${partKey++}`} style={styles.boldText}>
                {nextMatch[1]}
              </Text>
            );
          } else if (matchType === 'code') {
            parts.push(
              <Text key={`code-${partKey++}`} style={styles.inlineCode}>
                {nextMatch[1]}
              </Text>
            );
          }
          
          // Continue with the rest
          remaining = remaining.substring(nextMatch.index + nextMatch[0].length);
        } else {
          // No more matches, add the rest
          parts.push(remaining);
          break;
        }
      }
      
      return parts.length > 1 ? <>{parts}</> : parts[0] || text;
    };

    lines.forEach((line) => {
      // Check for code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Check for headers (###, ##, #)
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <Text key={key++} style={styles.h3}>
            {formatInlineText(line.slice(4).trim())}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <Text key={key++} style={styles.h2}>
            {formatInlineText(line.slice(3).trim())}
          </Text>
        );
      } else if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <Text key={key++} style={styles.h1}>
            {formatInlineText(line.slice(2).trim())}
          </Text>
        );
      }
      // Check for section headers (===)
      else if (line.includes('===') && line.trim().startsWith('===')) {
        flushList();
        const sectionTitle = line.replace(/=/g, '').trim();
        elements.push(
          <View key={key++} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          </View>
        );
      }
      // Check for bullet points
      else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        if (currentListType !== 'bullet') {
          flushList();
          currentListType = 'bullet';
        }
        currentList.push(line.trim().slice(2));
      }
      // Check for numbered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        if (currentListType !== 'numbered') {
          flushList();
          currentListType = 'numbered';
        }
        currentList.push(line.trim().replace(/^\d+\.\s/, ''));
      }
      // Regular paragraph (with inline formatting)
      else if (line.trim()) {
        flushList();
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {formatInlineText(line)}
          </Text>
        );
      }
      // Empty line
      else {
        flushList();
        elements.push(<View key={key++} style={styles.spacer} />);
      }
    });

    // Flush any remaining list or code block
    flushList();
    flushCodeBlock();

    return <>{elements}</>;
  };

  const renderMessage = (message: Message) => {
    return (
      <View key={message.id} style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}>
        <View style={styles.messageHeader}>
          <View style={[styles.avatarContainer, message.isUser ? styles.userAvatar : styles.aiAvatar]}>
            {message.isUser ? (
              <User size={16} color="white" />
            ) : (
              <Bot size={16} color="white" />
            )}
          </View>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
          {message.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : message.isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {message.text}
            </Text>
          ) : (
            formatAIResponse(message.text)
          )}
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    const quickQuestions = [
      {
        icon: <Database size={16} color="#007AFF" />,
        text: "Analyze my objects",
        question: "What are the main objects in my Salesforce org and how are they related? Please analyze the actual metadata."
      },
      {
        icon: <Code size={16} color="#007AFF" />,
        text: "Show relationships",
        question: "What is the relationship between Account and Contact objects in my org? Show me the actual fields."
      },
      {
        icon: <Workflow size={16} color="#007AFF" />,
        text: "Custom objects",
        question: "What custom objects exist in my org and what are they used for?"
      },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Questions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {quickQuestions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => setInputText(action.question)}
            >
              {action.icon}
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'AI Assistant',
          headerStyle: { backgroundColor: '#F8F9FA' },
          headerTitleStyle: { color: '#1D1D1F', fontWeight: '600' },
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Connection Status */}
        <View style={[styles.statusContainer, salesforceContext.isConnected ? styles.connectedStatus : styles.disconnectedStatus]}>
          <Sparkles size={16} color={salesforceContext.isConnected ? '#34C759' : '#FF9500'} />
          <Text style={[styles.statusText, salesforceContext.isConnected ? styles.connectedText : styles.disconnectedText]}>
            {salesforceContext.isConnected 
              ? `Connected to ${salesforceContext.objects.length} objects` 
              : 'Not connected to Salesforce'}
          </Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Quick Actions */}
        {messages.length <= 1 && renderQuickActions()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about your Salesforce org..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={20} color={(!inputText.trim() || isLoading) ? '#C7C7CC' : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  connectedStatus: {
    backgroundColor: '#E8F5E8',
  },
  disconnectedStatus: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  connectedText: {
    color: '#1B5E20',
  },
  disconnectedText: {
    color: '#E65100',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    backgroundColor: '#007AFF',
  },
  aiAvatar: {
    backgroundColor: '#34C759',
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1D1D1F',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8E8E93',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  quickActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Formatting styles
  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
    marginTop: 4,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 6,
    marginTop: 4,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
    marginTop: 2,
  },
  sectionHeader: {
    marginVertical: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '600',
    color: '#000000',
  },
  listContainer: {
    marginVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 8,
    minWidth: 20,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#1D1D1F',
  },
  codeBlock: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  codeBlockLang: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  codeBlockText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1D1D1F',
    lineHeight: 18,
  },
  inlineCode: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#007AFF',
  },
  spacer: {
    height: 8,
  },
});