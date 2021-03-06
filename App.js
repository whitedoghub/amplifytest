import React, { useEffect, useState } from 'react';
import {
  Button,
  Linking,
  Text,
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Amplify, { Auth, Hub } from 'aws-amplify';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import awsconfig from './aws-exports';

async function urlOpener(url, redirectUrl) {
  await InAppBrowser.isAvailable();
  const { type, url: newUrl } = await InAppBrowser.openAuth(url, redirectUrl, {
    showTitle: false,
    enableUrlBarHiding: true,
    enableDefaultShare: false,
    ephemeralWebSession: false,
  });

  if (type === 'success') {
    Linking.openURL(newUrl);
  }
}

Amplify.configure({
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    urlOpener,
  },
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          console.log('Hub.listen : signIn');
        case 'cognitoHostedUI':
          getUser().then((userData) => setUser(userData));
          break;
        case 'signOut':
          console.log('Hub.listen : signOut');
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data);
          break;
      }
    });

    console.log('===> useEffect');
    getUser().then((userData) => setUser(userData));
  }, []);

  const getUser = () =>
    Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log('Not signed in'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerView}>
        <Text>User: {user ? JSON.stringify(user.attributes) : 'None'}</Text>
        {user ? (
          <Button title="Sign Out" onPress={() => Auth.signOut()} />
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => Auth.federatedSignIn({ provider: 'Google' })}>
            <Text style={styles.buttonName}>Google SignIn</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerView: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#CED8F6',
    height: 50,
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonName: {
    textAlign: 'center',
    fontSize: 20,
  },
});

export default App;
