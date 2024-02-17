import { useEffect, useState } from "react";
import { View, Platform, Button, Text, Pressable } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { LogBox } from "react-native";
LogBox.ignoreLogs(["new NativeEventEmitter"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token.data;
}

export default function App() {
  const [token, setToken] = useState(
    "Vérifier votre connexion Internet ou l'état des serveurs d'expo"
  );

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setToken(token);
      console.log(token);
    });
  }, []);

  //Cette fonction envoie une requete utilisant l'API du serveur de notification
  //d'Expo mais il est plus réaliste de la placer coté backend
  function onClicNotification() {
    fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title: "hello",
        body: "world",
        data: { extraData: "Some data" },
      }),
    }).then((data) => console.log(data));
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>
        Pour envoyer une notification vous pouvez tester avec l'outil proposé
        par Expo :
      </Text>
      <Text style={{ marginTop: 10, fontStyle: "italic" }}>
        https://expo.dev/notifications
      </Text>
      <Text style={{ marginTop: 10 }}>
        en renseignant dans le champs "Recipent" le token :
      </Text>
      <Text style={{ marginTop: 10, fontWeight: "bold" }}>{token}</Text>
      <Text style={{ marginTop: 10 }}>
        (pour le copier il est également affiché dans la console)
      </Text>
      <Text style={{ marginTop: 40 }}>OU</Text>
      <Text style={{ marginVertical: 40 }}>
        Utiliser ce bouton pour lancer une requete en utilisant l'API du serveur
        de notification d'EXPO (dans un scenario plus réaliste, cette requête
        devrait être envoyée côté backend)
      </Text>
      <Pressable
        style={{ backgroundColor: "blue", padding: 20 }}
        onPress={onClicNotification}
      >
        <Text style={{ color: "white" }}>
          Envoyer demande notification au serveur d'EXPO
        </Text>
      </Pressable>
    </View>
  );
}
