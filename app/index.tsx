import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set a timeout to handle cases where auth state never resolves
    const timeout = setTimeout(() => {
      console.log('Index: Timeout reached, redirecting to login');
      setTimeoutReached(true);
      router.replace('/login');
    }, 5000); // 5 second timeout

    if (!isLoading) {
      clearTimeout(timeout);
      if (isAuthenticated) {
        console.log('Index: User authenticated, redirecting to objects tab');
        router.replace('/(tabs)/(objects)/list');
      } else {
        console.log('Index: User not authenticated, redirecting to login');
        router.replace('/login');
      }
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0176D3" />
      <Text style={styles.loadingText}>
        {timeoutReached ? 'Redirecting...' : 'Loading...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#706E6B',
    fontWeight: '500',
  },
});