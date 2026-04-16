<template>
  <div class="space-y-8 animate-fade-in pb-12 relative">
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto pt-8 relative z-10">
      <h1 class="text-4xl font-bold text-white tracking-tight mb-4">Choose Your Plan</h1>
      <p class="text-lg text-slate-400">Select the perfect monitoring tier for your organization's needs. Upgrade or downgrade at any time.</p>
    </div>

    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-4 relative z-10">
      <!-- Starter Plan -->
      <div class="glass-card p-8 border border-white/5 bg-white/5 flex flex-col rounded-[2rem] hover:border-indigo-500/30 transition-all duration-300 relative group">
        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-white mb-2">Starter</h2>
          <div class="flex items-baseline gap-1">
            <span class="text-slate-400 text-lg font-medium mr-1">฿</span>
            <span class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">2,000</span>
            <span class="text-slate-400 ml-1">/เดือน</span>
          </div>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">Essential monitoring for small teams and startups starting out.</p>
        </div>
        
        <div class="flex-1 mt-4">
          <ul class="space-y-4 text-sm text-slate-300">
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Up to 50 Monitored Devices</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>1 Week Data Retention</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Basic Anomaly Detection</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Email Alerts</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Community Support</span>
            </li>
          </ul>
        </div>
        
        <button class="mt-8 w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl font-medium transition-all duration-300">
          Get Started
        </button>
      </div>

      <!-- Pro Plan -->
      <div class="glass-card p-8 border-2 border-indigo-500 bg-indigo-500/5 flex flex-col rounded-[2rem] relative shadow-[0_0_30px_rgba(99,102,241,0.15)] transform md:-translate-y-4 transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-indigo-500/30">
          Most Popular
        </div>
        <div class="mb-6 mt-2">
          <h2 class="text-2xl font-semibold text-white mb-2">Pro</h2>
          <div class="flex items-baseline gap-1">
            <span class="text-slate-400 text-lg font-medium mr-1">฿</span>
            <span class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-400">5,000</span>
            <span class="text-slate-400 ml-1">/เดือน</span>
          </div>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">Advanced features for growing organizations requiring deeper insights.</p>
        </div>
        
        <div class="flex-1 mt-4">
          <ul class="space-y-4 text-sm text-slate-300">
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span class="text-white font-medium">Up to 250 Monitored Devices</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span class="text-white font-medium">1 Month Data Retention</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span>Advanced ML Anomaly Detection</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span>Email, SMS & Webhook Alerts</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span>Priority Support</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-sky-400 shrink-0" />
              <span>Custom Dashboards</span>
            </li>
          </ul>
        </div>
        
        <button class="mt-8 w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 shadow-lg shadow-indigo-500/25 text-white rounded-xl font-medium transition-all duration-300 translate-y-0 hover:-translate-y-0.5">
          Upgrade to Pro
        </button>
      </div>

      <!-- Enterprise Plan -->
      <div class="glass-card p-8 border border-white/5 bg-white/5 flex flex-col rounded-[2rem] hover:border-indigo-500/30 transition-all duration-300 relative group">
        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-white mb-2">Enterprise</h2>
          <div class="flex items-baseline gap-1">
            <span class="text-slate-400 text-lg font-medium mr-1">฿</span>
            <span class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">15,000+</span>
            <span class="text-slate-400 ml-1">/เดือน</span>
          </div>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">Custom solutions and scale for large-scale enterprise operations.</p>
        </div>
        
        <div class="flex-1 mt-4">
          <ul class="space-y-4 text-sm text-slate-300">
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Unlimited Devices / Nodes</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>1 Year+ Data Retention</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Predictive Analytics</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Dedicated Account Manager</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>24/7 Phone Support</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>On-premise Deployment Option</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Custom Integrations</span>
            </li>
          </ul>
        </div>
        
        <button class="mt-8 w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl font-medium transition-all duration-300">
          Contact Sales
        </button>
      </div>
    </div>
    
    <!-- Ambient light -->
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
  </div>
</template>

<script setup>
import { CheckCircle } from 'lucide-vue-next'
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
