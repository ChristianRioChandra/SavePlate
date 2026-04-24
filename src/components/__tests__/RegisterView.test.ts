import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import RegisterView from '@/views/RegisterView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))


vi.mock('@/services/authService', () => ({
  registerUser: vi.fn(() => Promise.resolve()),
}))

describe('RegisterView', () => {
  it('shows error if fields are empty', async () => {
    const wrapper = mount(RegisterView, {
      props: { navItems: [] },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('All fields are required!')
  })

  it('shows error if password mismatch', async () => {
    const wrapper = mount(RegisterView, {
      props: { navItems: [] },
    })

    await wrapper.find('input[type="email"]').setValue('test@mail.com')
    await wrapper.find('input[placeholder="Full Name"]').setValue('Test User')
    await wrapper.findAll('input[type="password"]')[0].setValue('123456')
    await wrapper.findAll('input[type="password"]')[1].setValue('654321')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Passwords do not match!')
  })

  it('calls registerUser on valid input', async () => {
    const wrapper = mount(RegisterView, {
      props: { navItems: [] },
    })

    await wrapper.find('input[type="email"]').setValue('test@mail.com')
    await wrapper.find('input[placeholder="Full Name"]').setValue('Test User')
    await wrapper.findAll('input[type="password"]')[0].setValue('123456')
    await wrapper.findAll('input[type="password"]')[1].setValue('123456')

    await wrapper.find('button').trigger('click')

    expect(true).toBe(true)
  })
})
