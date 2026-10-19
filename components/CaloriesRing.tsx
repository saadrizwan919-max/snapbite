import { View, Text } from 'react-native'
import React from 'react'
import Svg, {Circle} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';

const CaloriesRing = ({goal,eaten}:{goal:number,eaten:number}) => {
const size = 90;
const strokeWidth = 8;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const Eaten=eaten;
const Goal=goal;
const progress = Math.min(Eaten/Goal,1)
const offset = circumference * (1 - progress);

  return (
    <View className='  items-center px-7'>
     <View className=' bg-[#1A1E20] w-full flex-row items-center justify-between px-12 border-2 h-40 rounded-3xl'>

        <View className='justify-center'>
    
          <Text className='color-white mb-2 text-4xl font-bold'>{Eaten}
            <Text className='text-xl font-light'>/{Goal}</Text>
          </Text>
          <Text className='color-[#8E9397] text-sm'>Calories
            <Text className='font-semibold color-[#A0A6AC]'> eaten</Text>
          </Text>
    
        </View>
    
        <View style={{ width:size, height:size ,justifyContent:'center', alignItems:'center' }}>
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
             stroke="#FFFFFF"
             strokeWidth={strokeWidth}
             fill="none"
             strokeDasharray={circumference}
             strokeDashoffset={offset}
             strokeLinecap='round'
             rotation="-90"
             origin={`${size/2}, ${size/2}`}
             
            />
          </Svg>
    
         
            <Ionicons name='flame' size={28} color="#f97316" style={{position:'absolute'}}/>
          
          
          
        </View>
    
      </View>
    
 </View>
  
)
}


export default CaloriesRing