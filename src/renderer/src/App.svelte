<script lang="ts">
  import { onMount } from 'svelte'

  type ConnectionMode = 'usb' | 'tcpip' | 'unknown'

  interface AndroidDevice {
    id: string
    model: string
    status: string
    connectionMode: ConnectionMode
  }

  let devices: AndroidDevice[] = []
  let hostPort = ''
  let pairingCode = ''
  let scrcpyOptions = ''
  let loading = false
  let error = ''

  async function refreshDevices(): Promise<void> {
    try {
      loading = true
      error = ''
      devices = await window.electronAPI.getDevices()
    } catch (e) {
      error = 'Failed to get devices. Make sure ADB is installed and running.'
    } finally {
      loading = false
    }
  }

  async function pairDevice(): Promise<void> {
    try {
      loading = true
      error = ''
      await window.electronAPI.pairDevice(hostPort, pairingCode)
      await refreshDevices()
      hostPort = ''
      pairingCode = ''
    } catch (e) {
      error = 'Failed to pair device. Please check the host and pairing code.'
    } finally {
      loading = false
    }
  }

  async function connectDevice(host: string): Promise<void> {
    try {
      loading = true
      error = ''
      const result = await window.electronAPI.connectDevice(host)
      console.log('Connect result:', result)
      await refreshDevices()
    } catch (e) {
      error = 'Failed to connect to device.'
    } finally {
      loading = false
    }
  }

  async function startScrcpy(deviceId: string): Promise<void> {
    try {
      loading = true
      error = ''
      await window.electronAPI.startScrcpy(deviceId, scrcpyOptions)
    } catch (e) {
      error = 'Failed to start scrcpy.'
    } finally {
      loading = false
    }
  }

  async function enableTcpip(deviceId: string): Promise<void> {
    try {
      loading = true
      error = ''
      const result = await window.electronAPI.enableTcpip(deviceId)
      console.log('TCP/IP result:', result)
      alert('TCP/IP enabled. You can now disconnect the USB cable and connect wirelessly.')
    } catch (e) {
      error = 'Failed to enable TCP/IP mode.'
    } finally {
      loading = false
    }
  }

  async function disconnectDevice(deviceId: string): Promise<void> {
    try {
      loading = true
      error = ''
      await window.electronAPI.disconnectDevice(deviceId)
      await refreshDevices()
    } catch (e) {
      error = 'Failed to disconnect device.'
    } finally {
      loading = false
    }
  }

  onMount(refreshDevices)
</script>

<main class="container">
  <header>
    <h1>scrcpy wireless</h1>
    <p class="subtitle">Wireless Android screen mirroring</p>
  </header>

  {#if error}
    <div class="error">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      {error}
    </div>
  {/if}

  <div class="sections-container">
    <section class="pairing-section">
      <h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="section-icon"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M13 7h-2v2h2V7zm0 4h-2v2h2v-2zm2-6h-2v2h2V5zm2 0h-2v2h2V5zm-4 6h-2v2h2v-2zm2 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-1-9H5a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3zm1 13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h10a1 1 0 011 1v10z"
          />
        </svg>
        Pair New Device
      </h2>
      <div class="pairing-form">
        <div class="input-group">
          <label for="hostPort">Host:Port</label>
          <div class="input-wrapper">
            <input
              id="hostPort"
              type="text"
              bind:value={hostPort}
              placeholder="192.168.1.100:40001"
              disabled={loading}
            />
          </div>
        </div>
        <div class="input-group">
          <label for="pairingCode">Pairing Code</label>
          <div class="input-wrapper">
            <input
              id="pairingCode"
              type="text"
              bind:value={pairingCode}
              placeholder="123456"
              disabled={loading}
            />
          </div>
        </div>
        <div class="button-group">
          <button
            on:click={pairDevice}
            disabled={loading || !hostPort || !pairingCode}
            class="primary-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="button-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fill-rule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clip-rule="evenodd"
              />
            </svg>
            Pair Device
          </button>
          <button
            on:click={() => connectDevice(hostPort)}
            disabled={loading || !hostPort}
            class="secondary-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="button-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415z"
                clip-rule="evenodd"
              />
            </svg>
            Connect Device
          </button>
        </div>
      </div>
    </section>

    <section class="devices-section">
      <div class="section-header">
        <h2>Connected Devices</h2>
        <button on:click={refreshDevices} disabled={loading} class="icon-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="button-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd"
            />
          </svg>
          Refresh
        </button>
      </div>

      {#if devices.length === 0}
        <div class="no-devices">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="empty-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <p>No devices connected</p>
          <p class="hint">Connect your Android device via USB or pair wirelessly</p>
        </div>
      {:else}
        <div class="devices-grid">
          {#each devices as device}
            <div class="device-card" class:connected={device.connectionMode === 'tcpip'}>
              <div class="device-info">
                <div class="device-header">
                  <h3>{device.model}</h3>
                  <div class="device-header-actions">
                    <span class="connection-badge" class:tcpip={device.connectionMode === 'tcpip'}>
                      {device.connectionMode.toUpperCase()}
                    </span>
                    <button
                      on:click={() => disconnectDevice(device.id)}
                      disabled={loading}
                      class="icon-button delete-button"
                      title="Disconnect device"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p class="device-id">ID: {device.id}</p>
                <p class="device-status">Status: {device.status}</p>
              </div>
              <div class="device-actions">
                {#if device.connectionMode === 'usb'}
                  <button
                    on:click={() => enableTcpip(device.id)}
                    disabled={loading}
                    class="secondary-button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="button-icon"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Enable TCP/IP
                  </button>
                {/if}
                <div class="scrcpy-options">
                  <div class="input-wrapper">
                    <input
                      type="text"
                      bind:value={scrcpyOptions}
                      placeholder="scrcpy options (e.g. --max-fps=60)"
                    />
                  </div>
                  <button
                    on:click={() => startScrcpy(device.id)}
                    disabled={loading}
                    class="primary-button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="button-icon"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Start Mirroring
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</main>

<style>
  .container {
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    margin: 0;
    background-color: #f3f4f6;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  header {
    flex: 0 0 auto;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 2.5rem;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1.1rem;
  }

  section {
    background: #ffffff;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  section:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    display: flex;
    align-items: center;
    color: #1f2937;
    font-size: 1.5rem;
    margin: 0;
  }

  .section-icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.75rem;
    color: #2563eb;
  }

  .pairing-form {
    display: grid;
    gap: 1rem;
    max-width: none;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    color: #374151;
    font-size: 0.95rem;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
    background: #f9fafb;
  }

  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  input:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .devices-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, 1fr);
  }

  .device-card {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.2s;
  }

  .device-card:hover {
    transform: translateY(-2px);
    border-color: #2563eb;
  }

  .device-card.connected {
    border-color: #059669;
  }

  .device-header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .delete-button {
    color: #ef4444;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .delete-button:hover:not(:disabled) {
    background-color: #fee2e2;
  }

  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .device-info h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  .device-id,
  .device-status {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .connection-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
    background-color: #e5e7eb;
    color: #374151;
  }

  .connection-badge.tcpip {
    background-color: #059669;
    color: white;
  }

  .device-actions {
    margin-top: 1rem;
    display: grid;
    gap: 0.75rem;
  }

  .scrcpy-options {
    display: grid;
    gap: 0.5rem;
  }

  .scrcpy-options input {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }

  .button-group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-icon {
    width: 1.1rem;
    height: 1.1rem;
  }

  .primary-button {
    background-color: #2563eb;
    color: white;
  }

  .primary-button:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  .secondary-button {
    background-color: #4b5563;
    color: white;
  }

  .secondary-button:hover:not(:disabled) {
    background-color: #374151;
  }

  .icon-button {
    padding: 0.5rem;
    background-color: #f3f4f6;
    border-radius: 8px;
  }

  .icon-button:hover:not(:disabled) {
    background-color: #e5e7eb;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #fee2e2;
    color: #dc2626;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  .no-devices {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
    color: #9ca3af;
  }

  .hint {
    font-size: 0.9rem;
    margin-top: 0.5rem;
    color: #9ca3af;
  }

  .sections-container {
    flex: 1;
    display: flex;
    gap: 1.5rem;
    min-height: 0;
  }

  .pairing-section {
    flex: 0 0 25%;
    min-width: 300px;
    overflow: auto;
  }

  .devices-section {
    flex: 1;
    overflow: auto;
  }

  :global(html),
  :global(body),
  :global(#app) {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>
