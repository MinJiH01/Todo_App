import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

// 웹 환경에서 localStorage 사용
const storage = {
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('저장 실패:', error);
    }
  },
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('불러오기 실패:', error);
    }
    return null;
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  }
};

const STORAGE_KEYS = {
  TODOS: 'smart_todos_v1',
  THEME: 'smart_theme_v1',
  WEATHER: 'smart_weather_v1',
};

export default function App() {
  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allTodos, setAllTodos] = useState({});
  const [inputText, setInputText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 할일 설정
  const [selectedPriority, setSelectedPriority] = useState('normal');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [selectedTime, setSelectedTime] = useState('');
  
  // 필터
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // 날씨
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState('');

  // 테마
  const theme = {
    background: isDarkMode ? '#121212' : '#f5f5f5',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#333333',
    textSecondary: isDarkMode ? '#b3b3b3' : '#666666',
    border: isDarkMode ? '#333333' : '#e0e0e0',
    input: isDarkMode ? '#2a2a2a' : '#f8f8f8',
  };

  // 옵션들
  const priorities = [
    { value: 'high', label: '높음', color: '#ff4757', emoji: '🔴' },
    { value: 'normal', label: '보통', color: '#2196F3', emoji: '🔵' },
    { value: 'low', label: '낮음', color: '#9e9e9e', emoji: '⚪' }
  ];

  const categories = [
    { value: 'work', label: '업무', emoji: '💼' },
    { value: 'personal', label: '개인', emoji: '🏠' },
    { value: 'health', label: '건강', emoji: '💪' },
    { value: 'shopping', label: '쇼핑', emoji: '🛒' },
    { value: 'study', label: '학습', emoji: '📚' },
    { value: 'hobby', label: '취미', emoji: '🎨' }
  ];

  // 초기화
  useEffect(() => {
    console.log('🚀 앱 초기화 시작');
    initializeApp();
  }, []);

  // 자동 저장
  useEffect(() => {
    if (!isLoading && Object.keys(allTodos).length > 0) {
      console.log('💾 할일 자동 저장:', allTodos);
      saveTodos();
    }
  }, [allTodos, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      console.log('🎨 테마 자동 저장:', isDarkMode);
      saveTheme();
    }
  }, [isDarkMode, isLoading]);

  const initializeApp = async () => {
    try {
      console.log('📱 데이터 로딩 시작...');
      await loadAllData();
      await fetchWeather();
      console.log('✅ 초기화 완료');
    } catch (error) {
      console.error('❌ 초기화 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = async () => {
    // 할일 로드
    try {
      const savedTodos = storage.getItem(STORAGE_KEYS.TODOS);
      if (savedTodos) {
        const todosData = JSON.parse(savedTodos);
        console.log('📋 할일 로드됨:', todosData);
        setAllTodos(todosData);
      }
    } catch (error) {
      console.error('할일 로드 실패:', error);
    }

    // 테마 로드
    try {
      const savedTheme = storage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        const themeData = JSON.parse(savedTheme);
        console.log('🎨 테마 로드됨:', themeData);
        setIsDarkMode(themeData);
      }
    } catch (error) {
      console.error('테마 로드 실패:', error);
    }

    // 날씨 로드
    try {
      const savedWeather = storage.getItem(STORAGE_KEYS.WEATHER);
      if (savedWeather) {
        const weatherData = JSON.parse(savedWeather);
        const oneHour = 60 * 60 * 1000;
        
        if (Date.now() - weatherData.timestamp < oneHour) {
          console.log('🌤️ 캐시된 날씨 사용:', weatherData.data);
          setWeather(weatherData.data);
        }
      }
    } catch (error) {
      console.error('날씨 로드 실패:', error);
    }
  };

  const saveTodos = () => {
    try {
      storage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(allTodos));
      const now = new Date().toLocaleTimeString('ko-KR');
      setLastSaveTime(now);
      console.log('💾 할일 저장 완료:', now);
    } catch (error) {
      console.error('할일 저장 실패:', error);
    }
  };

  const saveTheme = () => {
    try {
      storage.setItem(STORAGE_KEYS.THEME, JSON.stringify(isDarkMode));
      console.log('🎨 테마 저장 완료');
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  };

  const saveWeather = (weatherData) => {
    try {
      const dataToSave = {
        data: weatherData,
        timestamp: Date.now()
      };
      storage.setItem(STORAGE_KEYS.WEATHER, JSON.stringify(dataToSave));
      console.log('🌤️ 날씨 저장 완료');
    } catch (error) {
      console.error('날씨 저장 실패:', error);
    }
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const conditions = ['맑음', '구름많음', '흐림', '비'];
      const icons = ['☀️', '⛅', '☁️', '🌧️'];
      const randomIndex = Math.floor(Math.random() * conditions.length);
      
      const weatherData = {
        location: '창원시',
        temperature: Math.floor(Math.random() * 15) + 10,
        condition: conditions[randomIndex],
        icon: icons[randomIndex],
        humidity: Math.floor(Math.random() * 30) + 40,
        windSpeed: (Math.random() * 3 + 1).toFixed(1),
      };
      
      setWeather(weatherData);
      saveWeather(weatherData);
      console.log('🌤️ 새 날씨 데이터:', weatherData);
    } catch (error) {
      console.error('날씨 가져오기 실패:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherColor = () => {
    if (!weather) return '#2196F3';
    
    const colorMap = {
      '맑음': '#FFA726',
      '구름많음': '#42A5F5',
      '흐림': '#78909C',
      '비': '#5C6BC0'
    };
    return colorMap[weather.condition] || '#2196F3';
  };

  // 필터링된 할일
  const filteredTodos = useMemo(() => {
    const todos = allTodos[selectedDate] || [];
    return todos.filter(todo => {
      const priorityMatch = filterPriority === 'all' || todo.priority === filterPriority;
      const categoryMatch = filterCategory === 'all' || todo.category === filterCategory;
      return priorityMatch && categoryMatch;
    }).sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [allTodos, selectedDate, filterPriority, filterCategory]);

  // 할일 추가
  const addTodo = () => {
    if (!inputText.trim()) return;

    const newTodo = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false,
      priority: selectedPriority,
      category: selectedCategory,
      time: selectedTime,
      createdAt: new Date().toISOString(),
    };

    console.log('➕ 새 할일 추가:', newTodo);

    const updatedTodos = {
      ...allTodos,
      [selectedDate]: [...(allTodos[selectedDate] || []), newTodo]
    };

    setAllTodos(updatedTodos);
    setInputText('');
    setSelectedTime('');
  };

  // 할일 토글
  const toggleTodo = (id) => {
    console.log('🔄 할일 토글:', id);
    
    const updatedTodos = {
      ...allTodos,
      [selectedDate]: allTodos[selectedDate].map(todo =>
        todo.id === id ? {
          ...todo,
          completed: !todo.completed,
          completedAt: !todo.completed ? new Date().toISOString() : null
        } : todo
      )
    };

    setAllTodos(updatedTodos);
  };

  // 할일 삭제
  const deleteTodo = (id) => {
    console.log('🗑️ 삭제 요청:', id);
    
    // 웹에서는 confirm 사용
    if (window.confirm('이 할일을 삭제하시겠습니까?')) {
      console.log('✅ 삭제 확인됨');
      
      const updatedTodos = {
        ...allTodos,
        [selectedDate]: allTodos[selectedDate].filter(todo => todo.id !== id)
      };

      setAllTodos(updatedTodos);
      console.log('🗑️ 삭제 완료');
    }
  };

  // 할일 수정
  const editTodo = (id, currentText) => {
    const newText = prompt('할일 수정:', currentText);
    if (newText && newText.trim() !== currentText) {
      console.log('✏️ 할일 수정:', id, newText);
      
      const updatedTodos = {
        ...allTodos,
        [selectedDate]: allTodos[selectedDate].map(todo =>
          todo.id === id ? { ...todo, text: newText.trim() } : todo
        )
      };

      setAllTodos(updatedTodos);
    }
  };

  // 캘린더 마킹
  const getMarkedDates = () => {
    const marked = {};
    
    Object.keys(allTodos).forEach(date => {
      if (allTodos[date]?.length > 0) {
        const completed = allTodos[date].filter(todo => todo.completed).length;
        const total = allTodos[date].length;
        
        let dotColor = '#ff4757';
        if (completed === total) dotColor = '#2ed573';
        else if (completed > 0) dotColor = '#ffa502';
        
        marked[date] = { marked: true, dotColor };
      }
    });
    
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#2196F3'
    };
    
    return marked;
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 전체 통계
  const getTotalStats = () => {
    let total = 0;
    let completed = 0;
    
    Object.values(allTodos).forEach(dayTodos => {
      total += dayTodos.length;
      completed += dayTodos.filter(todo => todo.completed).length;
    });
    
    return { total, completed };
  };

  const stats = getTotalStats();

  // 모든 데이터 삭제
  const clearAllData = () => {
    if (window.confirm('모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      console.log('🗑️ 모든 데이터 삭제');
      
      // localStorage 클리어
      storage.removeItem(STORAGE_KEYS.TODOS);
      storage.removeItem(STORAGE_KEYS.THEME);
      storage.removeItem(STORAGE_KEYS.WEATHER);
      
      // 상태 초기화
      setAllTodos({});
      setIsDarkMode(false);
      setWeather(null);
      setLastSaveTime('');
      
      alert('모든 데이터가 삭제되었습니다.');
    }
  };

  // 할일 아이템 렌더링
  const renderTodoItem = ({ item }) => {
    const priority = priorities.find(p => p.value === item.priority);
    const category = categories.find(c => c.value === item.category);

    return (
      <View style={[styles.todoItem, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.checkbox}>
          <Text style={styles.checkboxText}>{item.completed ? '✅' : '⭕'}</Text>
        </TouchableOpacity>
        
        <View style={styles.todoContent}>
          <View style={styles.todoHeader}>
            <View style={styles.todoTags}>
              <View style={[styles.priorityTag, { backgroundColor: priority.color }]}>
                <Text style={styles.priorityText}>{priority.emoji}</Text>
              </View>
              <View style={[styles.categoryTag, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                  {category.emoji} {category.label}
                </Text>
              </View>
            </View>
            {item.time && (
              <Text style={styles.timeText}>⏰ {item.time}</Text>
            )}
          </View>
          
          <TouchableOpacity onPress={() => editTodo(item.id, item.text)}>
            <Text style={[
              styles.todoText,
              { color: theme.text },
              item.completed && styles.completedText
            ]}>
              {item.text}
            </Text>
            {item.completed && item.completedAt && (
              <Text style={styles.completedTime}>
                ✓ {new Date(item.completedAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>📱 앱 로딩 중...</Text>
          <Text style={styles.loadingSubtext}>저장된 데이터를 복원하고 있습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: getWeatherColor() }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🌤️ Smart Todo</Text>
            <Text style={styles.subtitle}>완전한 저장 기능 지원</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={clearAllData}>
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.themeToggle}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Text style={styles.themeToggleText}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 통계 카드 */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statsTitle, { color: theme.text }]}>📊 실시간 통계</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>총 할일</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료율</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                {Object.keys(allTodos).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>활동일</Text>
            </View>
          </View>
          {lastSaveTime && (
            <Text style={[styles.saveTime, { color: theme.textSecondary }]}>
              💾 마지막 저장: {lastSaveTime}
            </Text>
          )}
        </View>

        {/* 날씨 카드 */}
        <View style={[styles.weatherCard, { backgroundColor: getWeatherColor() }]}>
          {weatherLoading ? (
            <View style={styles.weatherLoading}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.weatherLoadingText}>날씨 업데이트 중...</Text>
            </View>
          ) : weather ? (
            <>
              <View style={styles.weatherHeader}>
                <Text style={styles.weatherLocation}>📍 {weather.location}</Text>
                <TouchableOpacity onPress={fetchWeather} style={styles.refreshButton}>
                  <Text style={styles.refreshText}>🔄 새로고침</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.weatherMain}>
                <Text style={styles.weatherIcon}>{weather.icon}</Text>
                <View>
                  <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                  <Text style={styles.weatherCondition}>{weather.condition}</Text>
                </View>
              </View>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherDetail}>습도 {weather.humidity}%</Text>
                <Text style={styles.weatherDetail}>바람 {weather.windSpeed}m/s</Text>
              </View>
            </>
          ) : (
            <Text style={styles.weatherError}>날씨 정보를 불러올 수 없습니다</Text>
          )}
        </View>

        {/* 캘린더 */}
        <View style={[styles.calendarCard, { backgroundColor: theme.card }]}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: theme.card,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.textSecondary,
              selectedDayBackgroundColor: '#2196F3',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2196F3',
              dayTextColor: theme.text,
              textDisabledColor: theme.textSecondary,
              arrowColor: '#2196F3',
              monthTextColor: theme.text,
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
          />
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff4757' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>할일 있음</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ffa502' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>일부 완료</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2ed573' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>모두 완료</Text>
            </View>
          </View>
        </View>

        {/* 선택된 날짜 */}
        <View style={[styles.dateCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.dateText, { color: theme.text }]}>
            📅 {formatDate(selectedDate)}
          </Text>
        </View>

        {/* 할일 입력 영역 */}
        <View style={[styles.inputCard, { backgroundColor: theme.card }]}>
          
          {/* 우선순위 선택 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔥 우선순위</Text>
          <View style={styles.priorityRow}>
            {priorities.map(priority => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityButton,
                  { backgroundColor: priority.color },
                  selectedPriority === priority.value && styles.selectedPriority
                ]}
                onPress={() => setSelectedPriority(priority.value)}
              >
                <Text style={styles.priorityButtonText}>
                  {priority.emoji} {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 카테고리 선택 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📁 카테고리</Text>
          <View style={styles.categoryRow}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  { backgroundColor: theme.input, borderColor: theme.border },
                  selectedCategory === category.value && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.value)}
              >
                <Text style={[styles.categoryButtonText, { color: theme.text }]}>
                  {category.emoji} {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 시간 입력 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⏰ 시간 (선택사항)</Text>
          <TextInput
            style={[styles.timeInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
            placeholder="예: 09:00, 오후 2시"
            placeholderTextColor={theme.textSecondary}
            value={selectedTime}
            onChangeText={setSelectedTime}
          />

          {/* 할일 입력 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📝 할일</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.todoInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              placeholder="새 할일을 입력하세요..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={addTodo}
              multiline
            />
            <TouchableOpacity
              style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
              onPress={addTodo}
              disabled={!inputText.trim()}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 필터 */}
        <View style={[styles.filterCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔍 필터</Text>
          
          <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>우선순위:</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: theme.input, borderColor: theme.border },
                filterPriority === 'all' && styles.activeFilter
              ]}
              onPress={() => setFilterPriority('all')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: theme.textSecondary },
                filterPriority === 'all' && { color: 'white' }
              ]}>전체</Text>
            </TouchableOpacity>
            {priorities.map(priority => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.input, borderColor: priority.color },
                  filterPriority === priority.value && { backgroundColor: priority.color }
                ]}
                onPress={() => setFilterPriority(priority.value)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: theme.textSecondary },
                  filterPriority === priority.value && { color: 'white' }
                ]}>
                  {priority.emoji}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>카테고리:</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: theme.input, borderColor: theme.border },
                filterCategory === 'all' && styles.activeFilter
              ]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: theme.textSecondary },
                filterCategory === 'all' && { color: 'white' }
              ]}>전체</Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.input, borderColor: theme.border },
                  filterCategory === category.value && styles.activeFilter
                ]}
                onPress={() => setFilterCategory(category.value)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: theme.textSecondary },
                  filterCategory === category.value && { color: 'white' }
                ]}>
                  {category.emoji}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 할일 목록 */}
        <View style={[styles.todoListCard, { backgroundColor: theme.card }]}>
          <View style={styles.todoListHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📝 할일 목록 ({filteredTodos.length}개)
            </Text>
            {filteredTodos.length !== (allTodos[selectedDate] || []).length && (
              <Text style={[styles.filterStatus, { color: theme.textSecondary }]}>
                필터링됨 (전체: {(allTodos[selectedDate] || []).length}개)
              </Text>
            )}
          </View>

          {filteredTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {(allTodos[selectedDate] || []).length === 0 
                  ? '아직 할일이 없습니다.\n새로운 할일을 추가해보세요!' 
                  : '필터 조건에 맞는 할일이 없습니다.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTodos}
              renderItem={renderTodoItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // 헤더
  header: {
    padding: 20,
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
  },
  themeToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 18,
  },

  // 통계 카드
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  saveTime: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // 날씨 카드
  weatherCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weatherLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  weatherLoadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLocation: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  weatherCondition: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  weatherError: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },

  // 캘린더 카드
  calendarCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },

  // 날짜 카드
  dateCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  // 입력 카드
  inputCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedPriority: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  priorityButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#2196F3 !important',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  todoInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // 필터 카드
  filterCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // 할일 목록 카드
  todoListCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  todoListHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  filterStatus: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  // 할일 아이템
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    fontSize: 20,
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  todoTags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  priorityTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
  },
  categoryTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  todoText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedTime: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },

  // 하단 여백
  bottomPadding: {
    height: 20,
  },
});