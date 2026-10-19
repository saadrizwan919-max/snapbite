import { View, Text } from 'react-native'
import React from 'react'
import Svg,{Circle} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const MacrosStrip = ({name, emoji, macros, goal, color}:{name:String, emoji:String, macros:number, goal:number, color:string}) => {
const size = 44;
const strokeWidth = 4;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const Name=name;
const Emoji=emoji;
const Macros=macros;
const Goal=goal;
const Color=color;

const progress = Math.min(Macros/Goal,1);

const offset = circumference * (1 - progress);
  return (
          <View className=' items-start flex-1 bg-[#1A1E20]  px-3 pt-3 h-36 border-2 rounded-3xl'>
             
                     <View className='justify-center pb-3'>
                 
                       <Text className='color-white mb-2 text-xl font-bold'>{Macros}
                         <Text className='text-sm font-light'>/{Goal}g</Text>
                       </Text>
                       <Text className='color-[#8E9397] text-xs'>{Name}
                         <Text className='font-semibold color-[#A0A6AC]'> eaten</Text>
                       </Text>
                 
                     </View>
                 
                     <View style={{ alignSelf:'center', width:size, height:size ,justifyContent:'center', alignItems:'center' }}>
                       <Svg width={size} height={size}>
                         <Circle
                          cx={size/2}
                          cy={size/2}
                          r={radius}
                          stroke="#2a2e33"
                          strokeWidth={strokeWidth}
                          fill="none"
                         />
                 
                         <Circle
                          cx={size/2}
                          cy={size/2}
                          r={radius}
                          stroke={Color}
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap='round'
                          rotation="-90"
                          origin={`${size/2}, ${size/2}`}
                          
                         />
                       </Svg>
                 
                      
                         <Text style={{fontSize:16, position:'absolute'}}>{Emoji}</Text>
                       
                     </View>
                 
                   </View>
        
  )
}

export default MacrosStrip