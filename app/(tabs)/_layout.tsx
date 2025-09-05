import { Tabs, router } from "expo-router";
import { Layers3, Search, Share, Settings, BookOpen, Bot } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/providers/auth-provider";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Remove automatic redirect - let users access Settings tab to configure OAuth

  // Always render the Tabs component to maintain consistent hook order
  // The individual screens will handle authentication checks
  return (
    <Tabs
      initialRouteName="(objects)"
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5E7",
          borderTopWidth: 0.33,
          paddingTop: Platform.OS === 'ios' ? 12 : 16,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          height: Platform.OS === 'ios' ? 90 : 80,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 4,
          letterSpacing: 0.1,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="(objects)"
        options={{
          title: "Objects",
          tabBarIcon: ({ color }) => <Layers3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: "Export",
          tabBarIcon: ({ color }) => <Share size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="learning"
        options={{
          title: "Learning",
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => <Bot size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}