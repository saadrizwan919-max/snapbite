import { View, Text, FlatList, Pressable } from 'react-native'
import React, { useState , useRef} from 'react'
import CalendarModal, { DayStatus } from '@/components/CalendarModal';
import { useAppStore } from '@/store/useAppStore';
import {Ionicons} from '@expo/vector-icons';


 const startOfDay = (d:Date)=> new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dateKey = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today= startOfDay(new Date());
  const Days = Array.from(
    {length:60},
    (_,i)=> new Date(today.getFullYear(),today.getMonth(), today.getDate()-(59-i)))

const DataStrip = ({selectedDate, onSelectedDate}:{selectedDate:Date, onSelectedDate:(Date:Date)=>void}) => {

    const [showPicker, setShowPicker] = useState(false);
      const listRef = useRef<FlatList<Date>>(null);
    
      const selectDay= (date: Date)=>{
        onSelectedDate(date);
        const index= Days.findIndex((d)=> dateKey(d) === dateKey(date));
        if(index>=0){
          listRef.current?.scrollToIndex({
            index,
            viewPosition: 0.5,
            animated:true,
          })
        }
      }
     
      const handleSelect = (date: Date) => {
        setShowPicker(false);
        selectDay(startOfDay(date));
      }
      const handleDismiss = () => setShowPicker(false);

      // green / red days in the calendar, based on the user's daily calorie goal
      const DAILY_GOAL = useAppStore((st) => st.goals.calories);
      const dailyMeals = useAppStore((st) => st.dailyMeals);
      const getDayStatus = (key: string): DayStatus => {
        const meals = dailyMeals[key];
        if (!meals || meals.length === 0) return undefined;
        const total = meals.reduce((sum, m) => sum + m.calories, 0);
        return total <= DAILY_GOAL ? 'within' : 'over';
      };
    
      const renderItem=({item}:{item:Date})=>{
        const isSelected= dateKey(item) ===dateKey(selectedDate);
        // a day with at least one logged meal gets a tinted pill; days with nothing logged keep the normal colour
        const hasLogs = (dailyMeals[dateKey(item)]?.length ?? 0) > 0;
        return(
          <Pressable 
          onPress={()=>selectDay(item)}
          className={`mr-2 h-[68px] w-[52px] items-center justify-center rounded-2xl ${
            hasLogs ? 'bg-[#2B2840]' : 'bg-neutral-900'
          } ${
            isSelected ? 'border-2 border-white': 'border border-neutral-700'
          } `}
          >
            <Text className={` text-xs ${hasLogs ? 'text-[#B9B2E0]' : 'text-neutral-400'}`}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][item.getDay()]}
            </Text>
            <Text className=' text-lg font-semibold text-white'>{String(item.getDate()).padStart(2,'0')}</Text>
          </Pressable>
          
        )
      }

  return (
    <View className='flex-row items-center mx-2'>
      <FlatList
      ref={listRef}
      style={{flex:1}}
      data={Days}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(d)=>dateKey(d)}
      extraData={[selectedDate, dailyMeals]}
      getItemLayout={(_,index)=>({
        length:60,
        offset:60 * index,
        index,
      })}
      onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:false})}
      renderItem={renderItem}
      />

      <Pressable onPress={()=>setShowPicker(true)}
       className='ml-2 h-[68px] w-[68px] items-center justify-center rounded-full border border-neutral-700 bg-neutral-900' 
        >
        <Ionicons name='calendar-outline' size={28} color="white"/>
      </Pressable>

      <CalendarModal
        visible={showPicker}
        value={selectedDate}
        maxDate={today}
        onSelect={handleSelect}
        onClose={handleDismiss}
        getDayStatus={getDayStatus}
      />


    </View>
  )
}

export default DataStrip