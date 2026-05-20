// Фоновая отправка GPS-позиции водителя на бэк.
// Трекинг включается только когда isOnline=true (водитель сам решает «я на работе»).
// Throttle 30 сек — навигаторы и iOS могут спамить watchPosition при движении.
//
// Подключается одной строкой в layouts/cabinet-driver.vue.
// SSR-safe: проверяем typeof navigator.

const MIN_INTERVAL_MS = 30_000

export function useDriverLocation() {
  const { apiBase } = useApiBase()
  const { session } = useAuth()
  const { isOnline } = useDriverOnlineStatus()

  let watchId: number | null = null
  let lastSentAt = 0

  function sendLocation(pos: GeolocationPosition) {
    const now = Date.now()
    if (now - lastSentAt < MIN_INTERVAL_MS) return
    lastSentAt = now
    // Тихо игнорим ошибки сети: следующая позиция уйдёт через 30 сек.
    $fetch(`${apiBase}/cabinet/driver/location`, {
      method: 'POST',
      credentials: 'include',
      body: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    }).catch(() => {})
  }

  function start() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    if (watchId !== null) return
    watchId = navigator.geolocation.watchPosition(
      sendLocation,
      // Permission denied / timeout — молча. Тост покажем когда подключим UI.
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 60_000 },
    )
  }

  function stop() {
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
    watchId = null
    lastSentAt = 0
  }

  watch(
    () => ({ role: session.value?.user?.role, online: isOnline.value }),
    ({ role, online }) => {
      if (role === 'driver' && online === true) start()
      else stop()
    },
    { immediate: true },
  )

  onUnmounted(stop)
}
