<template>
  <SlideOver ref="shell" :label="`Incident ${incident.id}`" width="540px" @close="emit('close')">
      <!-- Identity -->
      <header class="shrink-0 border-b border-line px-3 py-2.5">
        <div class="flex items-start gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <SeverityTag :severity="incident.severity" />
              <span class="font-mono text-2xs text-ink-faint">{{ incident.id }}</span>
            </div>
            <h2 class="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-ink-primary">
              {{ incident.type }}
            </h2>
            <p class="mt-0.5 font-mono text-xs text-ink-muted">
              {{ fullTime }} · detected by {{ incident.detector }}
            </p>
          </div>

          <button class="btn h-7 w-7 shrink-0 px-0" aria-label="Close incident" @click="requestClose">
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <!-- Connection facts -->
        <section class="border-b border-line px-3 py-2.5">
          <h3 class="panel-title mb-2">Connection</h3>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
            <div v-for="f in facts" :key="f.label" class="min-w-0">
              <dt class="field-label">{{ f.label }}</dt>
              <dd class="truncate font-mono text-xs tabular-nums text-ink-primary" :title="f.value">
                {{ f.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- MITRE ATT&CK -->
        <section class="border-b border-line px-3 py-2.5">
          <h3 class="panel-title mb-2">MITRE ATT&amp;CK</h3>

          <div class="rounded border border-line bg-surface-panel p-2">
            <div class="flex items-baseline gap-2">
              <span class="font-mono text-sm font-semibold text-ink-primary">{{ incident.technique.id }}</span>
              <span class="truncate text-sm text-ink-secondary">{{ incident.technique.name }}</span>
            </div>
            <p class="mt-0.5 text-xs text-ink-muted">Tactic · {{ incident.technique.tactic }}</p>
          </div>

          <!-- Where this sits in the kill chain. Position is the useful fact:
               an Exfiltration hit late in the chain is a different shift than
               a Discovery hit at the start. -->
          <ul class="mt-2 flex flex-wrap gap-1">
            <li v-for="t in tactics" :key="t">
              <span
                class="inline-flex h-5 items-center rounded border px-1.5 text-2xs tracking-normal transition-colors duration-fast"
                :class="
                  t === incident.technique.tactic
                    ? 'border-line-strong bg-surface-hover font-semibold text-ink-primary'
                    : 'border-line text-ink-faint'
                "
              >
                {{ t }}
              </span>
            </li>
          </ul>
        </section>

        <!-- Payload -->
        <section class="px-3 py-2.5">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="panel-title">Packet payload</h3>
            <span class="font-mono text-2xs text-ink-faint">{{ payload.length }} bytes captured</span>
          </div>

          <div class="overflow-x-auto rounded border border-line bg-surface-base">
            <pre class="min-w-max p-2 font-mono text-2xs leading-[16px] tracking-normal"><span
              v-for="(line, i) in hexdump"
              :key="i"
              class="block"
            ><span class="text-ink-faint">{{ line.offset }}</span>  <span class="text-ink-secondary">{{ line.hex }}</span>  <span class="text-ink-muted">{{ line.ascii }}</span></span></pre>
          </div>

          <p class="mt-1.5 font-mono text-2xs text-ink-faint">
            sha256:{{ incident.hash }}… · truncated to first {{ hexdump.length * 16 }} bytes
          </p>
        </section>
      </div>

      <!-- Response. The only place on this surface where an irreversible
           action lives, so it gets the full width and explicit labels. -->
      <footer class="shrink-0 border-t border-line bg-surface-panel px-3 py-2.5">
        <div class="flex items-center gap-2">
          <button class="btn btn-danger flex-1" @click="act('isolate')">
            <ShieldOff class="h-3.5 w-3.5" aria-hidden="true" />
            Isolate host
          </button>
          <button class="btn flex-1" @click="act('block')">
            <Ban class="h-3.5 w-3.5" aria-hidden="true" />
            Block IP
          </button>
          <button class="btn flex-1" @click="act('dismiss')">
            <Check class="h-3.5 w-3.5" aria-hidden="true" />
            Dismiss
          </button>
        </div>
        <p class="mt-1.5 text-2xs text-ink-muted">
          Isolating removes <span class="font-mono text-ink-secondary">{{ incident.asset }}</span> from the
          network until manually restored.
        </p>
      </footer>
  </SlideOver>
</template>

<script setup>
import { computed, ref } from 'vue'
import { X, ShieldOff, Ban, Check } from 'lucide-vue-next'
import SeverityTag from './SeverityTag.vue'
import SlideOver from '~/components/ui/SlideOver.vue'

const props = defineProps({
  incident: { type: Object, required: true }
})

const emit = defineEmits(['close', 'action'])

const shell = ref(null)

// The slide-over owns the exit animation; ask it to leave rather than
// unmounting from under it.
const requestClose = () => shell.value?.requestClose()

const fullTime = computed(() => new Date(props.incident.ts).toISOString().replace('T', ' ').slice(0, 19) + 'Z')

const facts = computed(() => {
  const i = props.incident
  return [
    { label: 'Source', value: `${i.srcIp}:${i.srcPort}` },
    { label: 'Destination', value: `${i.asset}:${i.dstPort}` },
    { label: 'Protocol', value: i.protocol },
    { label: 'Service', value: i.service },
    { label: 'Action taken', value: i.action },
    { label: 'Origin', value: i.geo },
    { label: 'Transferred', value: `${(i.bytes / 1024).toFixed(1)} KB` },
    { label: 'Triage', value: i.status }
  ]
})

const tactics = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
  'Resource Development'
]

// A payload that matches the signature, so the hexdump is evidence rather than
// filler. Derived purely from the event, so it is stable across re-renders.
const PAYLOADS = {
  'SQL injection attempt':
    "GET /api/v2/accounts?id=1%27%20OR%20%271%27%3D%271%27-- HTTP/1.1\r\nHost: {asset}\r\nUser-Agent: sqlmap/1.7\r\n\r\n",
  'Credential stuffing':
    'POST /auth/login HTTP/1.1\r\nHost: {asset}\r\nContent-Type: application/json\r\n\r\n{"user":"svc_batch","pass":"Winter2024!"}',
  'Suspicious outbound beacon':
    'GET /pixel.gif?s={hash} HTTP/1.1\r\nHost: cdn-metrics-edge.net\r\nAccept: image/gif\r\nX-Session: {hash}\r\n\r\n',
  'Data exfiltration pattern':
    'STOR /outbound/cust_export_{hash}.tar.gz\r\nTYPE I\r\nPASV\r\n227 Entering Passive Mode\r\n',
  'Lateral movement (SMB)':
    '\\\\{asset}\\ADMIN$\\svcinstall.exe\r\nSMB2 TREE_CONNECT\r\nNTLMSSP_AUTH user=svc_deploy\r\n',
  'Port scan': 'TCP SYN {port} seq=0 win=1024 len=0\r\nTCP SYN 3389 seq=0 win=1024 len=0\r\n',
  'DDoS amplification':
    'DNS QUERY ANY isc.org\r\nEDNS0 bufsize=4096\r\nsrc={src} spoofed=true amp=54x\r\n',
  'Privilege escalation':
    'execve("/bin/sh", ["sh","-c","cp /bin/sh /tmp/.s; chmod u+s /tmp/.s"], envp)\r\n',
  'Anomalous query volume':
    'SELECT pan, cvv, holder FROM cards LIMIT 50000 OFFSET {port};\r\n-- 412 statements in 60s\r\n',
  'Expired certificate presented':
    'TLS ClientHello SNI={asset}\r\nCertificate notAfter=2024-11-02T00:00:00Z\r\nALERT certificate_expired(45)\r\n'
}

const payload = computed(() => {
  const i = props.incident
  const template = PAYLOADS[i.type] ?? `${i.protocol} ${i.srcIp}:${i.srcPort} -> ${i.asset}:${i.dstPort}\r\n`
  return template
    .replaceAll('{asset}', i.asset)
    .replaceAll('{hash}', i.hash)
    .replaceAll('{port}', String(i.dstPort))
    .replaceAll('{src}', i.srcIp)
})

const hexdump = computed(() => {
  const bytes = Array.from(payload.value).map((c) => c.charCodeAt(0) & 0xff)
  const lines = []
  for (let off = 0; off < bytes.length && lines.length < 10; off += 16) {
    const chunk = bytes.slice(off, off + 16)
    const hex = chunk
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(47, ' ')
    const ascii = chunk.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')
    lines.push({ offset: off.toString(16).padStart(8, '0'), hex, ascii })
  }
  return lines
})

const act = (kind) => {
  emit('action', { kind, incident: props.incident })
  requestClose()
}

</script>

