import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useIsFocused } from '@react-navigation/native';
import Axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Share, StyleSheet, Text, View } from 'react-native';
import Config from 'react-native-config';
import {
  ScrollView,
  TextInput,
  TouchableOpacity
} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { profile } from '../../assets';
import { ButtonCustom, HeaderComponent, Releoder } from '../../component';
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import { Rupiah } from '../../helper/Rupiah';
import { colors } from '../../utils/colors';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Dimensions } from 'react-native';
import { renameKey } from '../../utils';
import Select2 from 'react-native-select-two';
function useForceUpdate() {
  const [refresh, setRefresh] = useState(0); // integer state
  return () => setRefresh((refresh) => ++refresh); // update the state to force render
}

const ItemPaket = ({ item, onPress, style }) => (
 <View style={{width : '100%'}}>
    <TouchableOpacity onPress={onPress} style={[styles.item, style,  styles.agen]}>
      <Text style={styles.textName}>{item.name}</Text>
        <View style={{flexDirection : 'row', alignItems:'center'}}>
          <Image source={{uri: Config.BASE_URL + `${item.img}`}} style={{width : 80, height: 80, borderWidth:1, marginRight:20, marginBottom : 10}}/>
          {/* <Image style={{width : 80, height: 80, borderWidth:1, marginRight:20, marginBottom : 10}} source={profile}></Image> */}
          <Text style={{width : '70%'}}>{item.description}</Text>
        </View>
      <Text style={{fontSize : 15, letterSpacing : 1, fontWeight : 'bold'}}> {Rupiah(parseInt(item.price))}</Text>
    </TouchableOpacity>
 </View>
);

const ItemAgen = ({ item, onPress, style }) => (
  <View style={{width : '100%'}}>
     <TouchableOpacity onPress={onPress} style={[styles.item, style,  styles.agen]}>
       <Text style={[styles.textName]}>{item.name}</Text>
         <View style={{flexDirection : 'row', alignItems:'center'}}>
           <Image source={profile} style={{width : 80, height: 80, borderWidth:1, marginRight:20, marginBottom : 10}}/>
           {/* <Image style={{width : 80, height: 80, borderWidth:1, marginRight:20, marginBottom : 10}} source={profile}></Image> */}
            <View style={{width:'70%'}}>
              <Text style={{fontWeight :'bold'}}>Email</Text>
              <Text> {item.email}</Text>
              <Text style={{fontWeight :'bold'}}>No.Hp</Text>
              <Text> {item.phone}</Text>
              <Text style={{fontWeight :'bold'}}>Alamat</Text>
              <Text> {item.address}</Text>
            </View>
         </View>
       <Text style={{fontSize : 15, letterSpacing : 1, fontWeight : 'bold'}}> {item.status}</Text>
     </TouchableOpacity>
  </View>
 );

const Input = ({title,placeholder ='', ...rest}) => {
  // const userReducer = useSelector((state) => state.UserReducer.data);
  return (
    <View>
      <Text style={styles.textUsername}>{title}</Text>
      <TextInput style={styles.inputUsername} {...rest} placeholder = {placeholder}  />
    </View>
  );
};

const Profile = ({navigation}) => {
  const userReducer = useSelector((state) => state.UserReducer);
  const [form, setForm] = useState(userReducer);
  const dispatch = useDispatch();  
  const TOKEN = useSelector((state) => state.TokenApi);
  const [loading, setLoading] = useState(true);
  const [paket, setPaket] = useState(null)
  const [point, setPoint] = useState (0)
  const [pointUpgrade, setPointUpgrade] = useState (0)
  const [pointSaving, setPointSaving] = useState (0)
  const [selectedId, setSelectedId] = useState(null);
  const isFocused = useIsFocused();
  const [agen,setAgen] = useState()
  const[itemAgen ,setItemAGen] = useState(null)
  const [item1, setItem1]= useState(null)
  const [selectAgen, setSelectAgen] = useState(false)
  const [password, setPassword] = useState(null)
  const [confirmPassword, setConfirmPassword] = useState(null)
  const { width, height } = Dimensions.get('window');
  const [provinces, setProvinces] = useState(null)
  const [cities, setCities] = useState(null)
  const [oldCities, setOldCities] = useState(null)
  const [location, setLocation] = useState({
    latitude: 0.00000000,
    longitude: 0.00000000
})
  let dataUpdate = {
    id : '',
    name : '',
    phone : '',
    email : '',
    // password : '',
    address : '',
    lat :'',
    lng : '',
    province_id : '',
    city_id : ''
  }

  
  useEffect(() => {
    // let isMounted = true
    if(isFocused){
      getPaket()
      getPoint();
      getAgen();
      setForm(userReducer)
      locationApi()
      LocationServicesDialogBox.checkLocationServicesIsEnabled({
        message: "<h2 style='color: #0af13e'>Use Location ?</h2>This app wants to change your device settings:<br/><br/>Use GPS, Wi-Fi, and cell network for location<br/><br/><a href='#'>Learn more</a>",
        ok: "YES",
        cancel: "NO",
      }).then(function(success) {
          requestLocationPermission().then((result) => {
              Geolocation.getCurrentPosition((position) => {
                     setLocation({
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude, 
                    })
                    setLoading(false)
                },
                (error) => {
                    console.log(error);    
                    setLoading(false)
                },
                    { enableHighAccuracy: true, timeout: 200000, maximumAge: 1000 },
                );
          })
      }).catch((error) => {
          console.log(error.message); // error.message => "disabled"
          setLoading(false)
      })
    }
  }, [isFocused])

  useEffect(() => {
    filterCity(userReducer.province_id)
  }, [oldCities])

  const requestLocationPermission =  async () => {
    try {
        const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'Location Permission',
          'message': 'MyMapApp needs access to your location'
        }
        )

       if (granted === PermissionsAndroid.RESULTS.GRANTED) {
           console.log("Location permission granted")
       } else {
           console.log("Location permission denied")
       }
    } catch (err) {
       console.warn(err)
    }
  }


  const locationApi = () => {
    Axios.get('http://adminc.belogherbal.com/api/open/location', {
      headers : {
        'Accept' : 'application/json'
      }
    }).then((result) => {
      // console.log(result);
      result.data.province.forEach(obj => {renameKey(obj, 'title', 'name')});
      result.data.city.forEach(obj => {renameKey(obj, 'title', 'name')});
      setProvinces( result.data.province)
      setOldCities(result.data.city)
    }).catch((e) => {
      console.log('location', e);
    }).finally(() => setLoading(false))
  }

  const filterCity = (id) => {
    let data = []
    if(oldCities){
      oldCities.map((item, index) => {
        if(item.province_id == id){
          data[index] = item
        }
      })
    }

    console.log(data);

    setCities(data)
  }

  const getPaket = () => {
    Axios.get(Config.API_PACKAGES_MEMBER, 
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Accept' : 'application/json' 
        }
      }
    ).then((result) => {
      // console.log('result : ', result.data);
      setItem1(result.data.data)
      getPoint()
    }).catch((error) => {
      alert('koneksi error, mohon buka ulang aplikasinya')
      BackHandler.exitApp()
    });
  }

  const getAgen =() => {
    Axios.get(Config.API_AGENTS, 
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Accept' : 'application/json' 
        }
      }
    ).then((result) => {
      setItemAGen(result.data);
      setLoading(false);
    })
  }

  const onInputChange = (input, value) => {
    setForm({
      ...form,
      [input]: value,
    });
    // console.log(form.name)
  };

  const updateData = () => {
    dataUpdate.name = form.name
    dataUpdate.address = form.address
    dataUpdate.password = password
    dataUpdate.phone = form.phone
    dataUpdate.email = form.email
    dataUpdate.id = form.id
    dataUpdate.lng = form.lng
    dataUpdate.lat = form.lat
    dataUpdate.province_id = form.province_id
    dataUpdate.city_id = form.city_id
    setLoading(true)
    if(password !== null ) {
     if(password === confirmPassword){
        Axios.post(Config.API_UPDATE_PROFILE , dataUpdate,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Accept' : 'application/json' 
          }
        }
        ).then((result) => {
          // console.log('data profile',result.data)
          setForm(result.data.data)
          storeDataUser(result.data.data)
          dispatch({type: 'SET_DATA_USER', value: result.data.data});
          setPassword(null)
          setConfirmPassword(null)
          setLoading(false)
          console.log('data ciustomers',result);
          navigation.navigate('NotifAlert', {notif : 'Update Profile Berhasil'})
        }).catch((error) => {
          console.log('error ' + error);
            setLoading(false)
        });
     }else{
        alert('password tidak sama')
        setLoading(false)
     }
    }else{
      alert('mohon isi password')
      setLoading(false)
    }
    // console.log('data province', form.city_id)
  };


  const storeDataUser = async (value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem('@LocalUser', jsonValue)
    } catch (e) {
      console.log('Token not Save')
    }
  }


  const getPoint = () => {
    Axios.get(Config.API_POINT + `${userReducer.id}`, {
      headers : {
        Authorization: `Bearer ${TOKEN}`,
        'Accept' : 'application/json' 
      }
    })
    .then((result) => {
      // console.log('data point api', result.data.data[0].balance_points)
      setPoint(parseInt(result.data.data[0].balance_points))
      setPointUpgrade(parseInt(result.data.data[0].balance_upgrade_points))
      setPointSaving(parseInt(result.data.data[0].balance_saving_points))
      getAgen()
    }).catch(() => {
      alert('koneksi error, mohon buka ulang aplikasinya')
      BackHandler.exitApp()
    })
  }
  const activasi = () => {
    setLoading(true)
    if(paket !=null){
      if(agen !=null){
        if(point < parseInt(paket.price)){
          setLoading(false)
          alert('Point Anda Kurang silahkan Top Up dulu')
        }else{
          var dataActivasi = {
            id : form.id,
            package_id : paket.id,
            agents_id : agen.id
          }
          console.log(dataActivasi)
          Axios.post(Config.API_ACTIVE, dataActivasi,
            {
              headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Accept' : 'application/json' 
              }
            }
          ).then((result) => {
            alert('sukses activasi member')
            // forceUpdate();
            const dataUser = {
              ...form,
              status : 'active'
            }
            storeDataUser(dataUser)
            dispatch({type : 'SET_DATA_USER', value:dataUser}); 
            setForm(dataUser)
            setLoading(false)
            setStatus('active')
            navigation.navigate('NotifAlert', {notif : 'Sukses Activasi Member'})
          }).catch((error) => {
            // console.log(error.request._response.message);
            var mes = JSON.parse(error.request._response);
            alert(mes.message)
            setLoading(false)
          });
        }
      }else{
        setLoading(false)
        alert('mohon pilih agen yang anda inginkan')
      }
    }else{
      setLoading(false)
      alert('pilih paket yang anda inginkan dahulu')
    }
    // setStatus('active')
  }


  const renderItem = ({ item }) => {
    const borderColor = item.id === selectedId ? "#ff7b54" : colors.disable;

    return (
      <ItemPaket
        item={item}
        onPress={() => {setSelectedId(item.id);setPaket(item);}}
        style={{ borderColor }}
      />
    );
  };

  const renderItemAgen = ({ item }) => {
    const borderColor = item.id === selectedId ? "#ff7b54" : colors.disable;

    return (
      <ItemAgen
        item={item}
        onPress={() => {setSelectedId(item.id);setAgen(item);}}
        style={{ borderColor }}
      />
    );
  };


  const onShare = async () => {
    try {
      const result = await Share.share({
        message:form.ref_link,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // location

  if(loading){
    return (
      <Releoder/>
    )
  }

  if(form.status == 'pending' || form.status =='close'){
    return (
    <View style={styles.container}>
       <HeaderComponent/>
      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.label}>Nama  :</Text>
          <Text style={styles.isi}>{form.name}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Email   :</Text>
          <Text style={styles.isi}>{form.email}</Text>
        </View>

        {selectAgen ? 
          <View style={styles.bodyItem}>
            <FlatList
              style={{width: '100%'}}
              nestedScrollEnabled
              data={['']}
              keyExtractor={(data) => data}
              renderItem={({item, index}) => {
                switch (index) {
                  case 0:
                    return (
                      <View>
                        <Text style={styles.pilihPaket} >Pilih Agen</Text>
                        <FlatList
                          data={itemAgen}
                          renderItem={renderItemAgen}
                          keyExtractor={(item) => item.id.toString()}
                          extraData={selectedId}
                        />
                        {/* <TouchableOpacity style={styles.borderLogin} onPress = {() => activasi()} >
                          <Text style={styles.textBtnLogin}>Activasi Sekarang</Text>
                        </TouchableOpacity> */}
                      </View>
                    );
                  default:
                    return null;
                }
              }}
            />
              <View style={{ marginTop : 10, marginBottom:30, flexDirection : 'row', justifyContent:'space-between'}}>
                <ButtonCustom
                  name = 'Back Paket'
                  width = 'auto'
                  color = {'red'}
                  func = {() => {setSelectAgen(false); setPaket(null); setSelectedId(null)}}
                />
                <ButtonCustom
                  name = 'Activasi Sekarang'
                  width = '65%'
                  color = {colors.btn}
                  func = {() => Alert.alert(
                    'Peringatan',
                    `Ingin Activasi sekarang ? `,
                    [
                        {
                            text : 'Tidak',
                            onPress : () => console.log('tidak')
                        },
                        {
                            text : 'Ya',
                            onPress : () => activasi()
                        }
                    ]
                )}
                />
              </View>
          </View>
          
        : 
          <View style={styles.bodyItem}>
            <FlatList
              style={{width: '100%'}}
              nestedScrollEnabled
              data={['filter', 'title1', 'list1', 'title2', 'list2']}
              keyExtractor={(data) => data}
              renderItem={({item, index}) => {
                switch (index) {
                  case 0:
                    return (
                      <View>
                        <Text style={styles.pilihPaket} >Pilih Paket</Text>
                        <FlatList
                          data={item1}
                          renderItem={renderItem}
                          keyExtractor={(item) => item.id.toString()}
                          extraData={selectedId}
                        />
                        {/* <TouchableOpacity style={styles.borderLogin} onPress = {() => activasi()} >
                          <Text style={styles.textBtnLogin}>Activasi Sekarang</Text>
                        </TouchableOpacity> */}
                      </View>
                    );
                  default:
                    return null;
                }
              }}
              />
              <View style={{alignItems : 'center', justifyContent : 'center', marginTop : 10, marginBottom:30}}>
                {paket ? 
                  <ButtonCustom
                    name = 'Lanjutkan'
                    width = '100%'
                    color = {colors.btn}
                    func = {() => {setSelectAgen(true); setAgen(null); setSelectedId(null)}}
                  />
                  : 
                  <ButtonCustom
                    name = 'Lanjutkan'
                    width = '100%'
                    color = {colors.disable}
                    func = {() => {alert('pilih paket terlebih dahulu')}}
                  />
                }
              </View>
          </View>
        }
         
      </View>
    </View>
    )
  } else {
    return (
      <View style={styles.container}>
        <HeaderComponent/>
        <ScrollView>
          {/* update profile */}
          <View style={{backgroundColor: '#ffffff', padding: 20}}>
            
            <View style={{alignItems: 'center'}}>
              <QRCode
                value={form.phone}
              />
              {/* <Image
                source={barcode}
                style={{width: 100, height: 100, marginTop: 10}}
              /> */}
            </View>
            <View style={{ marginTop : 20, maxWidth : '100%', marginBottom : 20, flexDirection:'row'}}>
              <Text style={{flex:2}}>Link Referral :</Text>
              <View style={{flex:4}}>
                <Text  onPress={() => Linking.openURL(form.ref_link)}  style={{color : 'red'}}>{form.ref_link}</Text>
                <View style={{flexDirection:'row', marginTop:10}}>
                  <TouchableOpacity onPress={() =>{ Clipboard.setString(form.ref_link); alert('link is copy')}} style={{marginRight:20 }}>
                    <Icon name='clipboard' size={20} color='#9966ff' style={{textAlign:'center'}}/>
                    <Text style={{textAlign:'center'}}>Copy</Text>
                  </TouchableOpacity>
                 <TouchableOpacity onPress={onShare}>
                    <Icon name='share'color='#ff1a75' size={20} style={{textAlign:'center'}}/>
                    <Text style={{textAlign:'center'}}>share it</Text>
                 </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{maxWidth : '100%', marginBottom : 20, flexDirection:'row'}}>
              <Text style={{flex:2}}>Poin Belanja :</Text>
              <Text style={{flex:4,fontWeight : 'bold'}}>{Rupiah(point)}</Text>
            </View>

            <View style={{maxWidth : '100%', marginBottom : 20, flexDirection:'row'}}>
              <Text style={{flex:2}}>Poin Upgrade :</Text>
              <Text style={{flex:4,fontWeight : 'bold'}}>{Rupiah(pointUpgrade)}</Text>
            </View>

            <View style={{maxWidth : '100%', marginBottom : 20, flexDirection:'row'}}>
              <Text style={{flex:2}}>Poin Tabungan :</Text>
              <Text style={{flex:4,fontWeight : 'bold'}}>{Rupiah(pointSaving)}</Text>
            </View>

            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Edit Profile</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 10,
              }}>
              {/* <Image
                source={profile}
                style={{height: 50, width: 50, marginRight: 20}}
              /> */}
              {form.img == null || form.img == '' ?  
                <Image
                    source={profile}
                  style={{height: 50, width: 50, marginRight: 20}}
                /> : 
                <Image
                  source = {{uri : Config.BASE_URL + `${form.img}?time="` + new Date()}}
                style={{height: 50, width: 50, marginRight: 20}}
                />
              }
              <TouchableOpacity  onPress={()=>navigation.navigate('UploadImg')}>
              {/* onPress={()=>navigation.navigate('UploadImg')} */}
                <Text style={{fontSize: 15, color: '#03c4a1'}}>
                  Perbarui Foto Profile
                </Text>
              </TouchableOpacity>
            </View>
            <Input
              title="Nama Lengkap"
              value={form.name}
              onChangeText={(value) => onInputChange('name', value)}
            />
            <Input
              title="Password"
              secureTextEntry={true}
              value={password}
              onChangeText={(value) => setPassword(value)}
              placeholder = '***********'
            />
            <Input
              title="Confirm Password"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={(value) => setConfirmPassword(value)}
              placeholder = '***********'
            />
            <Input
              title="Email"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(value) => onInputChange('email', value)}
            />
            <Input
              title="Phone Number"
              keyboardType="numeric"
              value={form.phone}
              onChangeText={(value) => onInputChange('phone', value)}
            />
          <Text>Provinsi</Text>
         {provinces &&
             <Select2
             isSelectSingle
             style={{ borderRadius: 5 }}
             searchPlaceHolderText='Seacrh Province'
             colorTheme={colors.default}
             popupTitle="Select Province"
             title={form.provinces.title}
             selectButtonText='select'
             cancelButtonText = 'cancel'
             data={provinces}
             onSelect={value => {
               onInputChange('province_id', value[0])
               filterCity(value[0])
             }}
             style={{borderColor :colors.default, borderTopWidth : 0, borderRightWidth : 0,  borderLeftWidth : 0,}}
             onRemoveItem={value => {
               onInputChange('province_id', value[0])
             }}
           />
          }
          <View style={{marginVertical : 10}} />
          {(cities && form.city_id !=='') &&
            <>
            <Text>Kota</Text>
            <View style={{marginVertical : 10}} />
                <Select2
                isSelectSingle
                searchPlaceHolderText='Search City'
                style={{ borderRadius: 5 }}
                colorTheme={colors.default}
                popupTitle="Select Province"
                title={form.city.title}
                selectButtonText='select'
                cancelButtonText = 'cancel'
                data={cities}
                onSelect={value => {
                  onInputChange('city_id', value[0])
                }}
                onRemoveItem={value => {
                  onInputChange('city_id', value[0])
                }}
                style={{borderColor :colors.default, borderTopWidth : 0, borderRightWidth : 0,  borderLeftWidth : 0,}}
              />
            </>
            }
            <Input
              title="Alamat  "
              multiline={true}
              numberOfLines={4}
              value={form.address}
              onChangeText={(value) => onInputChange('address', value)}
            />
            <Text style={styles.textUsername} >Typae</Text>
            <View style={{flexDirection:'row',  alignItems : 'center', marginTop:10}}>
              {(form.activations && form.activations.name) &&              
                <ButtonCustom 
                  name = {form.activations.name}                
                  color = {colors.default}
                  width = '30%'
                />
              }
              <View style={{marginHorizontal : 10}} />
              <ButtonCustom 
                name = 'Upgrade'
                color = {colors.btn_primary}
                width = '50%'
                func = {() => navigation.navigate('UpgradeType')}
              />
            </View>
    
            <View style={{marginTop:40}}>
              <MapView
                  style={styles.map}
                  //  provider={PROVIDER_GOOGLE}
                  // showsUserLocation
                  initialRegion={{
                    latitude: parseFloat(form.lat) == 0.00000000 ?  location.latitude : parseFloat(form.lat),
                    longitude: parseFloat(form.lng) == 0.00000000 ?location.longitude : parseFloat(form.lng),
                    latitudeDelta:0.0022,
                    longitudeDelta:0.0121}}
                    followsUserLocation={true}
              >
                   <Marker
                      coordinate={{latitude : (parseFloat(form.lat) == 0.00000000 ?  location.latitude : parseFloat(form.lat)), longitude:(parseFloat(form.lng) == 0.00000000 ?location.longitude : parseFloat(form.lng))}}
                      // onDragEnd={e => console.log('onDragEnd', e.nativeEvent.coordinate.latitude)}
                      onDragEnd={(e) => setForm({
                          ...form,
                          lat : e.nativeEvent.coordinate.latitude,
                          lng : e.nativeEvent.coordinate.longitude
                      })}
                      draggable
                  >
                  </Marker>
              </MapView>
            </View>

              <View style = {{alignItems : 'center', justifyContent : 'center', marginTop : 20}}>
                <ButtonCustom
                  name = 'Update Data'
                  color = {colors.btn}
                  width = '100%'
                  // func = {() => updateData()}
                  func = {() => Alert.alert(
                    'Peringatan',
                    `Anda akan memperbarui profile ? `,
                    [
                        {
                            text : 'Tidak',
                            onPress : () => console.log(userReducer)
                        },
                        {
                            text : 'Ya',
                            onPress : () => updateData()
                        }
                    ]
                )}
              />
              </View>
          </View>
        </ScrollView>
      </View>
    );
  };
  }
  

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.disable,
  },
  textUsername: {
    justifyContent: 'flex-start',
    color: colors.dark,
    marginTop: 10,
  },
  inputUsername: {
    borderBottomWidth: 1,
    marginTop: -10,
    color: colors.dark,
    borderBottomColor: colors.default,
    marginBottom: 20,
    fontSize: 15,
  },
  borderLogin: {
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#ff781f',
    borderColor: '#ff781f',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
    marginTop: 15,
  },
  textBtnLogin: {
    color: '#ffffff',
    fontSize: 18,
  },
  body : {
    paddingHorizontal : 20,
    backgroundColor : '#ffffff',
    flex : 1,
    // marginBottom : 10
  },
  bodyItem : {
    // paddingHorizontal : 20,
    backgroundColor : '#ffffff',
    flex : 1,
    // marginBottom : 10
  },
  info : {
    flexDirection : 'row',
    alignItems : 'center',
    marginVertical : 10,
    marginTop : 10,
  }, 
  label : {
    fontSize :  15,
    color :'#ff781f',
    fontWeight : 'bold'
  },
  isi : {
    marginLeft : 30,
    fontSize : 15,
    fontWeight:'bold'
  },
  pilihPaket : {
    marginBottom : 10,
    fontSize : 20,
    color : '#ff781f',
    fontWeight:'bold'
  },
  agen : {
    padding : 20,
    marginBottom : 10,
    borderWidth : 3,
    // borderColor : colors.disable,
    borderRadius : 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 0,
  }, 
  textName : {
    fontSize : 15,
    fontWeight : 'bold',
    marginBottom : 10,
    color : '#ff781f'
  },
  textPoint : {
    fontWeight : 'bold',
  },
  type: {
    marginTop : 10,
    borderWidth : 1,
    padding : 5,
    width : 150,
    borderRadius : 10,
    textAlign : 'center',
    backgroundColor : 'rgba(250, 190, 88, 1)',
    borderColor : 'rgba(250, 190, 88, 1)',
    color : '#ffffff'
  },
  map: {
    height : 300,
    width : '100%',
  },
});
