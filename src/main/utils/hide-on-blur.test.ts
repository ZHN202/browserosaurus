import { EventEmitter } from 'node:events'

import hideOnBlur from './hide-on-blur.js'

const createWindow = () => {
  // eslint-disable-next-line unicorn/prefer-event-target -- BrowserWindow is an EventEmitter.
  const events = new EventEmitter()
  const window = {
    hide: jest.fn(() => {
      events.emit('hide')
    }),
    isDestroyed: jest.fn(() => false),
    isFocused: jest.fn(() => false),
    on: (event: 'blur' | 'focus' | 'hide', listener: () => void) =>
      events.on(event, listener),
  }
  hideOnBlur(window)
  return { events, window }
}

beforeEach(() => jest.useFakeTimers())

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

test('keeps the picker open when focus returns during a Space transition', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  jest.advanceTimersByTime(200)

  expect(window.hide).not.toHaveBeenCalled()

  window.isFocused.mockReturnValue(true)
  events.emit('focus')
  jest.advanceTimersByTime(100)

  expect(window.hide).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})

test('dismisses the picker when focus stays elsewhere', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  jest.advanceTimersByTime(249)

  expect(window.hide).not.toHaveBeenCalled()

  jest.advanceTimersByTime(1)

  expect(window.hide).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('rechecks focus if the focus event was missed', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  window.isFocused.mockReturnValue(true)
  jest.advanceTimersByTime(250)

  expect(window.hide).not.toHaveBeenCalled()
})

test('cancels stale dismissal when Escape hides the picker before reopening', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  window.hide()
  window.hide.mockClear()

  jest.advanceTimersByTime(500)

  expect(window.hide).not.toHaveBeenCalled()
  expect(jest.getTimerCount()).toBe(0)
})

test('restarts the delay for a new blur instead of using an earlier deadline', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  jest.advanceTimersByTime(200)
  events.emit('blur')
  jest.advanceTimersByTime(50)

  expect(window.hide).not.toHaveBeenCalled()

  jest.advanceTimersByTime(200)

  expect(window.hide).toHaveBeenCalledTimes(1)
})

test('does not access a destroyed window when a pending timer fires', () => {
  const { events, window } = createWindow()
  events.emit('blur')
  window.isDestroyed.mockReturnValue(true)

  expect(() => jest.advanceTimersByTime(250)).not.toThrow()
  expect(window.isFocused).not.toHaveBeenCalled()
  expect(window.hide).not.toHaveBeenCalled()
})
