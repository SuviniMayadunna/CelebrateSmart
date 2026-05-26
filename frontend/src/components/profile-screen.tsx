import { useState } from 'react';
import { AppScreen } from '@/App';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { User, Lock } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface ProfileScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const labelStyle = { color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' };
const inputClass = 'h-11 rounded-xl border-2 focus:border-green-700 transition-colors';
const inputStyle = { borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' };

export function ProfileScreen({ onNavigate: _onNavigate }: ProfileScreenProps) {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) { toast({ variant: 'destructive', title: 'Name is required' }); return; }
    setProfileSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: profileForm.name.trim(), phone: profileForm.phone.trim() });
      updateUser({ name: res.data.user.name, phone: res.data.user.phone });
      toast({ title: 'Profile updated', description: 'Your information has been saved.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Update failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) { toast({ variant: 'destructive', title: 'Enter your current password' }); return; }
    if (passwordForm.newPassword.length < 6) { toast({ variant: 'destructive', title: 'New password must be at least 6 characters' }); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast({ variant: 'destructive', title: 'Passwords do not match' }); return; }
    setPasswordSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Change failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
      <main className='max-w-2xl mx-auto px-4 sm:px-6 py-10'>

        {/* Header */}
        <div className='mb-8 animate-fade-in'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
              Account
            </span>
          </div>
          <h1 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>My Profile</h1>
        </div>

        <div className='space-y-6'>

          {/* Personal Info */}
          <div className='bg-white rounded-2xl border overflow-hidden animate-fade-in' style={{ borderColor: 'hsl(150,12%,88%)' }}>
            <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(155,38%,27%), hsl(43,74%,49%))' }} />
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'hsl(155,25%,97%)' }}>
                  <User className='w-4 h-4' style={{ color: 'hsl(155,38%,27%)' }} />
                </div>
                <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>Personal Information</h2>
              </div>

              {/* Email read-only */}
              <div className='mb-4 p-3 rounded-xl' style={{ background: 'hsl(150,18%,97%)', border: '1px solid hsl(150,12%,88%)' }}>
                <p className='text-xs uppercase tracking-widest font-semibold mb-0.5' style={labelStyle}>Email Address</p>
                <p className='text-sm font-medium' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>{user?.email}</p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'>
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Full Name *</label>
                  <Input
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    className={inputClass} style={inputStyle}
                    placeholder='Your full name'
                  />
                </div>
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Phone Number</label>
                  <Input
                    value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputClass} style={inputStyle}
                    placeholder='+1 555 000 0000'
                  />
                </div>
              </div>

              <Button
                onClick={() => void handleSaveProfile()}
                disabled={profileSaving}
                className='rounded-xl font-semibold gap-2 px-6'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}
              >
                {profileSaving && <Spinner className='w-4 h-4' />}
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Change Password */}
          <div className='bg-white rounded-2xl border overflow-hidden animate-fade-in' style={{ borderColor: 'hsl(150,12%,88%)', animationDelay: '0.05s' }}>
            <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(155,38%,27%))' }} />
            <div className='p-6'>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'hsl(43,74%,97%)' }}>
                  <Lock className='w-4 h-4' style={{ color: 'hsl(43,60%,35%)' }} />
                </div>
                <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>Change Password</h2>
              </div>

              <div className='space-y-4 mb-5'>
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Current Password</label>
                  <Input
                    type='password'
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className={inputClass} style={inputStyle}
                    placeholder='Enter current password'
                  />
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>New Password</label>
                    <Input
                      type='password'
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      className={inputClass} style={inputStyle}
                      placeholder='Min. 6 characters'
                    />
                  </div>
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Confirm New Password</label>
                    <Input
                      type='password'
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className={inputClass} style={inputStyle}
                      placeholder='Repeat new password'
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => void handleChangePassword()}
                disabled={passwordSaving}
                className='rounded-xl font-semibold gap-2 px-6'
                style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}
              >
                {passwordSaving && <Spinner className='w-4 h-4' />}
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
