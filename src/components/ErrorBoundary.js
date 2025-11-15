import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20, justifyContent: 'center' }}>
          <ScrollView>
            <Text style={{ color: '#ff3333', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              ⚠️ App Error
            </Text>
            
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 12 }}>
              {this.state.error?.toString()}
            </Text>

            {this.state.errorInfo && (
              <Text style={{ color: '#b0b0b0', fontSize: 12, fontFamily: 'monospace', marginBottom: 16 }}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}

            <TouchableOpacity
              onPress={this.resetError}
              style={{
                backgroundColor: '#FF6B35',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
