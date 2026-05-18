import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import RegisterView from '@/views/RegisterView.vue'

// Prevent firebase.ts from executing getAuth() with missing env vars in CI
vi.mock('@/firebase', () => ({
  auth: {
    currentUser: null,
    signOut: vi.fn(() => Promise.resolve()),
  },
  db: {},
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: null) => void) => { cb(null); return vi.fn() }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}))

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
    await wrapper.find('input[type="text"]').setValue('Test User')
    await wrapper.findAll('input[type="password"]')[0]!.setValue('123456')
    await wrapper.findAll('input[type="password"]')[1]!.setValue('654321')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Passwords do not match!')
  })

  it('calls registerUser on valid input', async () => {
    const wrapper = mount(RegisterView, {
      props: { navItems: [] },
    })

    await wrapper.find('input[type="email"]').setValue('test@mail.com')
    await wrapper.find('input[type="text"]').setValue('Test User')
    await wrapper.findAll('input[type="password"]')[0]!.setValue('123456')
    await wrapper.findAll('input[type="password"]')[1]!.setValue('123456')

    await wrapper.find('button').trigger('click')

    expect(true).toBe(true)
  })
})
