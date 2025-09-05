import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Search, Database, Type, Grid3X3, Building2, Zap, Code, Settings, Shield, Layout, Layers, Component, Filter, X, ChevronDown, ChevronRight } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { searchSalesforce } from "@/services/salesforce";

interface SearchResult {
  id: string;
  type: string;
  name: string;
  label: string;
  fileName?: string;
  matches?: {
    line: number;
    content: string;
    snippet: string;
    context: string;
  }[];
  totalMatches?: number;
  objectName?: string;
  fieldType?: string;
  description?: string;
  status?: string;
}

const METADATA_TYPES = [
  { key: 'all', label: 'All Types', icon: Database },
  { key: 'apex-class', label: 'Apex Classes', icon: Code },
  { key: 'apex-trigger', label: 'Apex Triggers', icon: Settings },
  { key: 'flow', label: 'Flows', icon: Zap },
  { key: 'validation-rule', label: 'Validation Rules', icon: Shield },
  { key: 'lwc-bundle', label: 'Lightning Web Components', icon: Component },
  { key: 'aura-bundle', label: 'Aura Components', icon: Layers },
  { key: 'page-layout', label: 'Page Layouts', icon: Layout },
  { key: 'record-type', label: 'Record Types', icon: Grid3X3 },
] as const;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { accessToken, instanceUrl, isAuthenticated, isLoading } = useAuth();

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    if (selectedFilters.includes('all')) {
      return searchResults;
    }
    return searchResults.filter(result => selectedFilters.includes(result.type));
  }, [searchResults, selectedFilters]);

  // Group results by metadata type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [filteredResults]);

  // Get metadata type info
  const getMetadataTypeInfo = (type: string) => {
    const metadataType = METADATA_TYPES.find(mt => mt.key === type);
    return metadataType || { key: type, label: getMetadataTypeLabel(type), icon: Database };
  };

  // Handle filter toggle
  const toggleFilter = useCallback((filterKey: string) => {
    setSelectedFilters(prev => {
      if (filterKey === 'all') {
        return ['all'];
      }
      
      const newFilters = prev.includes(filterKey)
        ? prev.filter(f => f !== filterKey)
        : [...prev.filter(f => f !== 'all'), filterKey];
      
      return newFilters.length === 0 ? ['all'] : newFilters;
    });
  }, []);

  // Handle accordion toggle
  const toggleAccordion = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      const results = await searchSalesforce(instanceUrl!, accessToken!, query);
      return results as SearchResult[];
    },
    onSuccess: (results) => {
      setSearchResults(results);
      setHasSearched(true);
    },
    onError: (error) => {
      console.error('Search error:', error);
      setSearchResults([]);
      setHasSearched(true);
    }
  });

  // Handle search button press
  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2) {
      searchMutation.mutate(searchQuery.trim());
    }
  }, [searchQuery, searchMutation]);

  // If not authenticated, show appropriate message
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0176D3" />
        <Text style={styles.searchingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Metadata</Text>
          <Text style={styles.subtitle}>Search inside code and metadata content</Text>
        </View>
        <View style={styles.centerContainer}>
          <Search size={48} color="#706E6B" />
          <Text style={styles.errorText}>Not Connected</Text>
          <Text style={styles.errorSubtext}>
            Go to Settings to configure OAuth or enable Demo Mode
          </Text>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }



  const getMetadataIcon = (type: string) => {
    switch (type) {
      case "object":
        return <Grid3X3 size={22} color="#1B96FF" />;
      case "field":
        return <Type size={22} color="#1B96FF" />;
      case "flow":
        return <Zap size={22} color="#9333EA" />;
      case "apex-class":
        return <Code size={22} color="#DC2626" />;
      case "apex-trigger":
        return <Settings size={22} color="#DC2626" />;
      case "validation-rule":
        return <Shield size={22} color="#EA580C" />;
      case "record-type":
        return <Database size={22} color="#059669" />;
      case "page-layout":
        return <Layout size={22} color="#0891B2" />;
      case "aura-bundle":
        return <Layers size={22} color="#7C3AED" />;
      case "lwc-bundle":
        return <Component size={22} color="#7C3AED" />;
      default:
        return <Database size={22} color="#6B7280" />;
    }
  };

  const getMetadataColor = (type: string) => {
    switch (type) {
      case "object":
        return "#E3F2FD";
      case "field":
        return "#E3F2FD";
      case "flow":
        return "#F3E8FF";
      case "apex-class":
        return "#FEE2E2";
      case "apex-trigger":
        return "#FEE2E2";
      case "validation-rule":
        return "#FED7AA";
      case "record-type":
        return "#D1FAE5";
      case "page-layout":
        return "#CFFAFE";
      case "aura-bundle":
        return "#EDE9FE";
      case "lwc-bundle":
        return "#EDE9FE";
      default:
        return "#F3F4F6";
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text key={index} style={styles.highlightedText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const getMetadataTypeLabel = (type: string) => {
    switch (type) {
      case "object": return "Object";
      case "field": return "Field";
      case "flow": return "Flow";
      case "apex-class": return "Apex Class";
      case "apex-trigger": return "Apex Trigger";
      case "validation-rule": return "Validation Rule";
      case "record-type": return "Record Type";
      case "page-layout": return "Page Layout";
      case "aura-bundle": return "Aura Component";
      case "lwc-bundle": return "Lightning Web Component";
      default: return "Metadata";
    }
  };

  const renderMetadataItem = (item: SearchResult) => {
    const isExpanded = expandedItems.has(item.id);
    const hasMatches = item.matches && item.matches.length > 0;
    
    return (
      <View key={item.id} style={styles.metadataItem}>
        <TouchableOpacity
          style={styles.metadataItemHeader}
          onPress={() => {
            if (item.type === "object") {
              router.push(`/(tabs)/(objects)/${item.name}`);
            } else if (item.type === "field") {
              router.push({
                pathname: "/(tabs)/(objects)/field-details",
                params: {
                  objectName: item.objectName || "",
                  fieldName: item.name,
                  fieldLabel: item.label,
                  fieldType: item.fieldType || "",
                },
              });
            } else if (hasMatches) {
              toggleAccordion(item.id);
            } else {
              setSelectedResult(item);
            }
          }}
        >
          <View style={styles.metadataItemInfo}>
            <Text style={styles.metadataItemLabel}>
              {highlightSearchTerm(item.label, searchQuery)}
            </Text>
            
            {/* File name for code search results */}
            {item.fileName && (
              <Text style={styles.fileName}>
                📄 {item.fileName}
              </Text>
            )}
            
            {/* Show total matches if available */}
            {item.totalMatches && item.totalMatches > 0 && (
              <Text style={styles.matchCount}>
                {item.totalMatches} match{item.totalMatches !== 1 ? 'es' : ''} found
              </Text>
            )}
            
            {/* Fallback for non-code search results */}
            {!item.matches && (
              <>
                <Text style={styles.resultName}>
                  {highlightSearchTerm(item.name, searchQuery)}
                </Text>
                {item.description && (
                  <Text style={styles.resultMeta}>
                    {highlightSearchTerm(item.description, searchQuery)}
                  </Text>
                )}
                {item.objectName && item.type !== "object" && (
                  <Text style={styles.objectReference}>
                    📋 {item.objectName}
                  </Text>
                )}
                {item.status && (
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: item.status === 'Active' ? '#D1FAE5' : '#FEE2E2' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: item.status === 'Active' ? '#059669' : '#DC2626' }
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
          
          {hasMatches && (
            <View style={styles.chevronContainer}>
              {isExpanded ? (
                <ChevronDown size={16} color="#6B7280" />
              ) : (
                <ChevronRight size={16} color="#6B7280" />
              )}
            </View>
          )}
        </TouchableOpacity>
        
        {/* Expanded content with line numbers */}
        {isExpanded && hasMatches && (
          <View style={styles.metadataItemContent}>
            {item.matches!.map((match, index) => (
              <View key={`${item.id}-match-${index}`} style={styles.expandedMatchItem}>
                <View style={styles.matchHeader}>
                  <Text style={styles.lineNumber}>Line {match.line}</Text>
                  <Text style={styles.contextLabel}>{match.context}</Text>
                </View>
                <Text style={styles.codeSnippet}>
                  {highlightSearchTerm(match.snippet, searchQuery)}
                </Text>
                {/* Show multi-line content if available */}
                {match.content && match.content.includes('\n') && (
                  <View style={styles.multiLineContent}>
                    <Text style={styles.multiLineText}>
                      {match.content.split('\n').map((line, lineIndex) => (
                        <Text key={lineIndex} style={styles.codeLine}>
                          {highlightSearchTerm(line, searchQuery)}{lineIndex < match.content.split('\n').length - 1 ? '\n' : ''}
                        </Text>
                      ))}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMetadataTypeAccordion = (type: string, items: SearchResult[]) => {
    const isExpanded = expandedItems.has(`type-${type}`);
    const typeInfo = getMetadataTypeInfo(type);
    const IconComponent = typeInfo.icon;
    
    return (
      <View key={type} style={styles.accordionContainer}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleAccordion(`type-${type}`)}
        >
          <View style={[styles.resultIcon, { backgroundColor: getMetadataColor(type) }]}>
            <IconComponent size={22} color={getMetadataIcon(type).props.color} />
          </View>
          <View style={styles.resultInfo}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>
                {typeInfo.label}
              </Text>
              <View style={styles.headerRight}>
                <View style={styles.metadataCountBadge}>
                  <Text style={styles.metadataCountText}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  {isExpanded ? (
                    <ChevronDown size={16} color="#6B7280" />
                  ) : (
                    <ChevronRight size={16} color="#6B7280" />
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Expanded content with metadata items */}
        {isExpanded && (
          <View style={styles.accordionContent}>
            {items.map(item => renderMetadataItem(item))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Metadata</Text>
        <Text style={styles.subtitle}>Search inside code and metadata content</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#706E6B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for keywords in code, flows, triggers..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color={showFilters ? "#1B96FF" : "#706E6B"} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.searchButton, { opacity: searchQuery.length >= 2 ? 1 : 0.5 }]}
          onPress={handleSearch}
          disabled={searchQuery.length < 2 || searchMutation.isPending}
        >
          {searchMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Search size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {METADATA_TYPES.map((filter) => {
              const isSelected = selectedFilters.includes(filter.key);
              const IconComponent = filter.icon;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillSelected
                  ]}
                  onPress={() => toggleFilter(filter.key)}
                >
                  <IconComponent 
                    size={16} 
                    color={isSelected ? "#FFFFFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {searchMutation.isPending ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0176D3" />
          <Text style={styles.searchingText}>Searching...</Text>
        </View>
      ) : hasSearched ? (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              {selectedFilters.length > 1 || !selectedFilters.includes('all') ? (
                <Text style={styles.filterInfo}> (filtered)</Text>
              ) : null}
            </Text>
            {selectedFilters.length > 1 || !selectedFilters.includes('all') ? (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setSelectedFilters(['all'])}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
                <X size={14} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView 
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {Object.keys(groupedResults).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Search size={48} color="#E5E5E5" />
                <Text style={styles.emptyText}>No metadata found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching for field names, method names,{"\n"}
                  variable names, or any code content
                </Text>
              </View>
            ) : (
              Object.entries(groupedResults).map(([type, items]) => 
                renderMetadataTypeAccordion(type, items)
              )
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.centerContainer}>
          <Search size={48} color="#E5E5E5" />
          <Text style={styles.promptText}>
            Enter at least 2 characters and tap search
          </Text>
        </View>
      )}

      {/* Detailed Result Modal */}
      {selectedResult && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalIcon, { backgroundColor: getMetadataColor(selectedResult.type) }]}>
                  {getMetadataIcon(selectedResult.type)}
                </View>
                <View>
                  <Text style={styles.modalTitle}>{selectedResult.label}</Text>
                  <Text style={styles.modalSubtitle}>{getMetadataTypeLabel(selectedResult.type)}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setSelectedResult(null)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedResult.fileName && (
              <Text style={styles.modalFileName}>📄 {selectedResult.fileName}</Text>
            )}
            
            <ScrollView style={styles.modalScrollView}>
              {selectedResult.matches && selectedResult.matches.map((match, index) => (
                <View key={index} style={styles.modalMatchItem}>
                  <View style={styles.modalMatchHeader}>
                    <Text style={styles.modalLineNumber}>Line {match.line}</Text>
                    <Text style={styles.modalContextLabel}>{match.context}</Text>
                  </View>
                  <Text style={styles.modalCodeSnippet}>
                    {highlightSearchTerm(match.snippet, searchQuery)}
                  </Text>
                  {match.content && match.content.includes('\n') && (
                    <View style={styles.modalMultiLineContent}>
                      <Text style={styles.modalMultiLineText}>
                        {match.content.split('\n').map((line, lineIndex) => (
                          <Text key={lineIndex} style={styles.modalCodeLine}>
                            {highlightSearchTerm(line, searchQuery)}{lineIndex < match.content.split('\n').length - 1 ? '\n' : ''}
                          </Text>
                        ))}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },
  header: {
    backgroundColor: "#1B96FF",
    padding: 24,
    paddingTop: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#FFFFFF",
    opacity: 0.9,
    fontWeight: "500",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F3F4",
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 17,
    color: "#16325C",
    fontWeight: "500",
  },
  searchButton: {
    backgroundColor: "#1B96FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 12,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  searchingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#747474",
    fontWeight: "500",
  },
  promptText: {
    marginTop: 20,
    fontSize: 17,
    color: "#747474",
    textAlign: "center",
    fontWeight: "500",
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  listContent: {
    paddingVertical: 16,
  },
  accordionContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
    backgroundColor: "#FAFBFC",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronContainer: {
    marginLeft: 8,
    padding: 4,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#16325C",
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  resultName: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
    marginTop: 2,
  },
  resultMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "400",
    lineHeight: 14,
  },
  metadataTypeBadge: {
    backgroundColor: "#F1F3F4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metadataTypeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  metadataCountBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  metadataCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0369A1",
  },
  metadataItem: {
    backgroundColor: "#FFFFFF",
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F3F4",
  },
  metadataItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  metadataItemInfo: {
    flex: 1,
  },
  metadataItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16325C",
    lineHeight: 18,
  },
  metadataItemContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F4",
    backgroundColor: "#FAFBFC",
  },
  highlightedText: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontWeight: "700",
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  objectReference: {
    fontSize: 12,
    color: "#6366F1",
    marginTop: 4,
    fontWeight: "500",
  },
  statusContainer: {
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    color: "#747474",
    marginBottom: 8,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#747474",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16325C",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 15,
    color: "#747474",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  settingsButton: {
    backgroundColor: "#1B96FF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#1B96FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  fileName: {
    fontSize: 12,
    color: "#6366F1",
    fontFamily: "monospace",
    marginTop: 4,
    fontWeight: "500",
  },
  matchCount: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
  },
  matchesContainer: {
    marginTop: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    padding: 8,
  },
  expandedMatchItem: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  matchItem: {
    marginBottom: 6,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  lineNumber: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: "monospace",
  },
  codeSnippet: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "monospace",
    lineHeight: 18,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  contextLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "500",
    marginLeft: 8,
  },
  multiLineContent: {
    marginTop: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  multiLineText: {
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
    color: "#374151",
  },
  codeLine: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#374151",
  },
  showMoreButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "600",
  },
  moreMatches: {
    fontSize: 10,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterPillSelected: {
    backgroundColor: "#1B96FF",
    borderColor: "#1B96FF",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  filterPillTextSelected: {
    color: "#FFFFFF",
  },
  filterInfo: {
    color: "#6B7280",
    fontWeight: "400",
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  clearFiltersText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginRight: 4,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16325C",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  modalFileName: {
    fontSize: 14,
    color: "#6366F1",
    fontFamily: "monospace",
    marginBottom: 16,
    fontWeight: "500",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalMatchItem: {
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
  },
  modalMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalLineNumber: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    backgroundColor: "#6B7280",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontFamily: "monospace",
  },
  modalContextLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginLeft: 12,
  },
  modalCodeSnippet: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "monospace",
    lineHeight: 20,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalMultiLineContent: {
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  modalMultiLineText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
    color: "#374151",
  },
  modalCodeLine: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#374151",
  },
});