import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native'
import WebView from 'react-native-webview';

const Pay = ({navigation, route}) => {
    let urimap = route.params.urimap    
    useEffect(() => {
       console.log(urimap);
    }, [])
    return (
        <SafeAreaView style={styles.container}>
            {/* <Text>{urimap}</Text> */}
            <WebView
                source={{
                uri: urimap
            }}/>
        </SafeAreaView>
    )
}

export default Pay

const styles = StyleSheet.create({
    container : {
        flex : 1
    }
})
