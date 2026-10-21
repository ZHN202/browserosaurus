type DismissibleWindow = {
  hide: () => void
  isDestroyed: () => boolean
  isFocused: () => boolean
  // BrowserWindow.on requires separate event overloads rather than a union.
  /* eslint-disable @typescript-eslint/unified-signatures */
  on: {
    (event: 'blur', listener: () => void): unknown
    (event: 'focus', listener: () => void): unknown
    (event: 'hide', listener: () => void): unknown
  }
  /* eslint-enable @typescript-eslint/unified-signatures */
}

/** Allow transient focus loss while macOS switches Spaces. */
export default function hideOnBlur(window: DismissibleWindow): void {
  let blurTimer: ReturnType<typeof setTimeout> | undefined

  const cancelDismissal = () => {
    clearTimeout(blurTimer)
    blurTimer = undefined
  }

  window.on('focus', cancelDismissal)
  window.on('hide', cancelDismissal)
  window.on('blur', () => {
    cancelDismissal()
    blurTimer = setTimeout(() => {
      blurTimer = undefined
      if (!window.isDestroyed() && !window.isFocused()) {
        window.hide()
      }
    }, 250)
  })
}
