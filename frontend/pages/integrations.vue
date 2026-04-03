<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Data Sources & Integrations</h1>
        <p class="text-slate-400 mt-1">Manage centralized data pipelines from your existing infrastructure and legacy
          systems.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toast.add('New Connection', 'Opening wizard to connect a new data source...', 'info')"
          class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Add Integration
        </button>
      </div>
    </div>

    <!-- Active Connections Summary -->
    <div
      class="glass-card p-4 border border-slate-700/50 flex flex-wrap items-center gap-6 overflow-hidden relative text-sm">
      <div class="flex items-center gap-2 whitespace-nowrap">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
        <span class="text-slate-400">Total Connectors:</span>
        <span class="font-mono font-bold text-white text-lg">8 Active</span>
      </div>
      <div class="w-px h-6 bg-slate-700/50 hidden md:block"></div>
      <div class="flex items-center gap-2 whitespace-nowrap animate-pulse-slow">
        <span class="text-slate-400">Data Ingestion Rate:</span>
        <span class="font-mono font-bold text-sky-400 text-lg">452 MB/s</span>
        <Database class="w-4 h-4 text-sky-400" />
      </div>
    </div>

    <!-- Integrations Grid -->
    <div>
      <h2 class="text-lg font-semibold text-white mb-4">Cloud Infrastructure</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard name="AWS CloudWatch" description="Metrics & log data sync" status="Connected" type="Cloud"
          icon="Cloud" iconColor="text-orange-400" />
        <IntegrationCard name="Microsoft Azure Monitor" description="VM & Network telemetry" status="Syncing"
          type="Cloud" icon="CloudSnow" iconColor="text-blue-400" />
        <IntegrationCard name="Google Cloud Audit" description="GCP audit logs pipeline" status="Disconnected"
          type="Cloud" icon="CloudCog" iconColor="text-rose-400" />
        <IntegrationCard name="Kubernetes Cluster" description="Pod metrics & Kube state" status="Connected"
          type="Container" icon="Box" iconColor="text-indigo-400" />
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-white mb-4 mt-8">Database & Legacy Systems</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard name="Oracle Database (Legacy)" description="Transaction performance" status="Connected"
          type="Database" icon="Database" iconColor="text-red-500" />
        <IntegrationCard name="PostgreSQL Cluster" description="Main backend DB queries" status="Connected"
          type="Database" icon="Database" iconColor="text-blue-500" />
        <IntegrationCard name="Redis Cache" description="In-memory cache latency" status="Connected" type="Cache"
          icon="Layers" iconColor="text-rose-500" />
        <IntegrationCard name="Legacy Mainframe" description="IBM Z-Series transaction logs" status="Warning"
          type="Core" icon="Server" iconColor="text-amber-400" />
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-white mb-4 mt-8">Security & Monitoring Tools</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntegrationCard name="Splunk Forwarder" description="Log forwarding stream" status="Connected" type="Logs"
          icon="Terminal" iconColor="text-white" />
        <IntegrationCard name="Palo Alto Firewall" description="Network security events" status="Connected"
          type="Security" icon="ShieldCheck" iconColor="text-emerald-500" />
        <IntegrationCard name="Active Directory" description="IAM and User Logins" status="Connected" type="Auth"
          icon="Users" iconColor="text-indigo-400" />
        <IntegrationCard name="Custom API Webhook" description="Internal team tools" status="Connected" type="API"
          icon="Code" iconColor="text-slate-400" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { Plus, Database, Cloud, CloudSnow, CloudCog, Box, Layers, Server, Terminal, ShieldCheck, Users, Code } from 'lucide-vue-next'
import { inject } from 'vue'

const toast = inject('toast')

// Local Component Definition for Integration Card
const IntegrationCard = {
  props: ['name', 'description', 'status', 'type', 'icon', 'iconColor'],
  setup(props) {
    const icons = { Cloud, CloudSnow, CloudCog, Box, Database, Layers, Server, Terminal, ShieldCheck, Users, Code }
    const IconComponent = icons[props.icon]

    const getStatusStyle = (status) => {
      if (status === 'Connected') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      if (status === 'Syncing') return 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
      if (status === 'Warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      return 'bg-slate-800 text-slate-400 border-slate-700'
    }

    return { IconComponent, getStatusStyle }
  },
  template: `
    <div class="glass-card p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col h-full">
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <component :is="IconComponent" class="w-5 h-5" :class="iconColor" />
        </div>
        <span class="px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap" :class="getStatusStyle(status)">
          {{ status }}
        </span>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{{ name }}</h3>
        <p class="text-xs text-slate-400 mt-1 mb-3 line-clamp-2">{{ description }}</p>
      </div>
      <div class="mt-auto pt-3 border-t border-slate-700/50">
        <span class="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Module: {{ type }}</span>
      </div>
    </div>
  `
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-pulse-slow {
  animation: pulse 3s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
