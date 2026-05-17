<template>
  <aside class="right-sidebar">
    <div class="right-box premium-box">
      <div class="bulk-select-controls">
        <span class="selection-count"><i class="bi bi-lightning-charge-fill"></i> {{ quickActionsTitle }}</span>
      </div>
      <slot name="quick-actions">
        <button class="right-btn action-add" @click="$emit('add-food')">
          <div class="icon-wrapper"><i class="bi bi-plus-lg"></i></div>
          <span>Add Food Item</span>
          <i class="bi bi-chevron-right arrow"></i>
        </button>
        <button class="right-btn action-donate" @click="$emit('donate-items')">
          <div class="icon-wrapper"><i class="bi bi-heart-fill"></i></div>
          <span>Donate Items</span>
          <i class="bi bi-chevron-right arrow"></i>
        </button>
        <button class="right-btn action-plan" @click="$emit('plan-meal')">
          <div class="icon-wrapper"><i class="bi bi-calendar-event-fill"></i></div>
          <span>Plan Meal</span>
          <i class="bi bi-chevron-right arrow"></i>
        </button>
      </slot>
    </div>

    <div class="right-box stats-box">
      <h3 class="box-title">Overview</h3>
      <slot name="stats">
        <div class="stat-item">
          <div class="stat-label">
            <div class="stat-icon-wrapper total-bg"><i class="bi bi-boxes"></i></div>
            <span>Total items</span>
          </div>
          <strong class="stat-value">{{ totalItems }}</strong>
        </div>
        <div class="stat-item">
          <div class="stat-label">
            <div class="stat-icon-wrapper warn-bg"><i class="bi bi-exclamation-circle-fill"></i></div>
            <span>Expiring soon</span>
          </div>
          <strong class="stat-value warning">{{ expiringSoon }}</strong>
        </div>
      </slot>
    </div>

    <div class="right-box tip-box">
      <div class="tip-bg-shape"></div>
      <div class="tip-icon"><i class="bi bi-lightbulb-fill"></i></div>
      <div class="tip-content">
        <h4>Pantry Tip</h4>
        <p>Keep your most perishable items at eye level to prevent food waste.</p>
      </div>
    </div>

    <slot name="extra"></slot>
  </aside>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  quickActionsTitle?: string
  totalItems?: number
  expiringSoon?: number
}>(), {
  quickActionsTitle: 'Quick Actions',
  totalItems: 0,
  expiringSoon: 0,
})

defineEmits<{
  (e: 'add-food'): void
  (e: 'donate-items'): void
  (e: 'plan-meal'): void
}>()
</script>

<style scoped>
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
}

.right-box {
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 12px 34px rgba(31, 47, 62, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(233, 237, 242, 0.6);
  position: relative;
  overflow: hidden;
}

/* Quick Actions Premium */
.bulk-select-controls {
  text-align: center;
}

.selection-count {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #4f46e5;
  padding: 8px 18px;
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.right-btn {
  background: #ffffff;
  border: 1px solid #e9edf2;
  padding: 12px 16px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #17304f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
}

.right-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(31, 47, 62, 0.08);
  border-color: #d1d9e6;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: 0.2s;
}

.action-add .icon-wrapper {
  background: #eef6ef;
  color: #2c7a4d;
}
.action-donate .icon-wrapper {
  background: #fff0f2;
  color: #e11d48;
}
.action-plan .icon-wrapper {
  background: #f0f7ff;
  color: #0284c7;
}

.arrow {
  margin-left: auto;
  color: #a0aec0;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.right-btn:hover .arrow {
  transform: translateX(4px);
  color: #17304f;
}

/* Stats Box */
.box-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e3a2f;
  margin-bottom: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #e2e8f0;
}

.stat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #4a5568;
}

.stat-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.total-bg {
  background: #f1f5f9;
  color: #475569;
}

.warn-bg {
  background: #fffbeb;
  color: #d97706;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a202c;
}

.stat-value.warning {
  color: #d97706;
}

/* Tip Box */
.tip-box {
  background: linear-gradient(145deg, #1e3a2f 0%, #2c7a4d 100%);
  color: white;
  padding: 24px;
  border: none;
}

.tip-bg-shape {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
}

.tip-icon {
  font-size: 1.8rem;
  color: #fbbf24;
  margin-bottom: 8px;
}

.tip-content h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.tip-content p {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #e2e8f0;
  opacity: 0.9;
}
</style>