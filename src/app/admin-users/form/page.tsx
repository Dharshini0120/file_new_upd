/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '../../../components/PageHeader';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useQuery, useMutation } from '@apollo/client';
import {
  ADMIN_GET_USER_BY_ID,
  ADMIN_CREATE_USER_MUTATION,
  ADMIN_UPDATE_USER_MUTATION,
} from '../../../graphql/user.service';
import { GetUserByIdResponse, AdminCreateUserInput, UpdateUserInput } from '@shared-types/auth/auth.types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { withPageLoader } from '@frontend/shared-ui';

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

const CreateUserForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const isEditMode = !!userId;

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'user',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Fetch user data for edit mode
  const { data: userData, loading: userLoading } = useQuery(
    ADMIN_GET_USER_BY_ID,
    {
      skip: !isEditMode || !userId,
      variables: { userId },
      fetchPolicy: 'network-only',
    }
  );

  const [adminCreateUser] = useMutation(ADMIN_CREATE_USER_MUTATION);
  const [adminUpdateUser] = useMutation(ADMIN_UPDATE_USER_MUTATION);

  // Labels + validation
  const fieldLabels: Record<keyof FormState, string> = {
    fullName: 'Full Name',
    email: 'Email',
    phoneNumber: 'Phone Number',
    role: 'Role',
  };

  const validateField = (name: string, value: any) => {
    const label = fieldLabels[name as keyof FormState] || name;

    // Skip email validation in edit mode
    if (isEditMode && name === 'email') return '';

    if (!value) return `${label} is required`;
    if (name === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value)) return `Please enter a valid ${label}`;
    }
    if (name === 'phoneNumber') {
      const re = /^[0-9()+\-\s]{7,15}$/;
      if (!re.test(value)) return `Please enter a valid ${label}`;
    }
    if (name === 'fullName') {
      const re = /^[A-Za-z ]{1,50}$/;
      if (!re.test(value)) return `${label} should only contain alphabets and spaces (max 50)`;
    }
    return '';
  };

  useEffect(() => {
    if (isEditMode && userData?.admingetUserById?.data?.user) {
      const user = userData.admingetUserById.data.user;
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'user',
      });
    }
  }, [isEditMode, userData]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'fullName') {
      setForm((p) => ({ ...p, [name]: value.replace(/[^A-Za-z ]/g, '').slice(0, 50) }));
      return;
    }
    if (name === 'email') {
      setForm((p) => ({ ...p, [name]: value.replace(/[{}|<>]/g, '') }));
      return;
    }
    if (name === 'phoneNumber') {
      setForm((p) => ({ ...p, [name]: value.replace(/[^0-9()+\-\s]/g, '').slice(0, 15) }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: validateField(e.target.name, (e.target as any).value),
    }));

  const validateForm = () => {
    const next: FormErrors = {};
    (Object.keys(form) as (keyof FormState)[]).forEach(
      (k) => (next[k] = validateField(k, form[k]))
    );
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const isFormValid = !!form.fullName && (isEditMode || !!form.email) && !!form.phoneNumber && !!form.role;



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      let response;
      let result;

      if (isEditMode) {
        // For update, only send changed fields (excluding email)
        const updateInput = {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          role: form.role,
        };
        response = await adminUpdateUser({ variables: { userId, input: updateInput } });
        result = response.data.adminupdateUser;
      } else {
        // For create, send all fields
        const createInput = {
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          role: form.role,
        };
        response = await adminCreateUser({ variables: { input: createInput } });
        result = response.data.admincreateUser;
      }

      if (result?.status === 'success') {
        toast.success(result.message || (isEditMode ? 'User updated successfully' : 'User created successfully'));
        router.push('/admin-users');
      } else {
        toast.error(result?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Operation error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reusable field renderer similar to signup page
  const renderField = (
    name: keyof FormState,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    options?: string[]
  ) => {
    const isDisabled = isEditMode && name === 'email'; // Disable email in edit mode

    return (
      <TextField
        key={`${name}-field`}
        select={!!options}
        name={name}
        value={form[name] as any}
        onChange={options ? (e) => handleSelectChange(name, e.target.value) : handleInputChange}
        onBlur={handleBlur}
        label={label}
        placeholder={!options ? placeholder : undefined}
        disabled={isDisabled}
        fullWidth
        InputLabelProps={{
          shrink: true,
          sx: {
            fontSize: '0.95rem',
            color: isDisabled ? '#bbb' : '#9ca3af',
            '&.Mui-focused': { color: isDisabled ? '#bbb' : '#9ca3af' },
            transform: 'translate(14px, 16px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -8px) scale(0.85)',
              backgroundColor: '#fff',
              px: 0.5,
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ pr: 0.5 }}>
              {icon}
              <Box sx={{ height: 28, width: 1.3, bgcolor: '#b0b0b0', ml: 1 }} />
            </InputAdornment>
          ),
        }}
        variant="outlined"
        error={!!errors[name]}
        helperText={errors[name] || ' '}
        FormHelperTextProps={{ sx: { minHeight: 20, ml: 0 } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: isDisabled ? '#f5f5f5' : '#fff',
            fontSize: '1rem',
            minHeight: '56px',
            '& fieldset': { borderColor: isDisabled ? '#ddd' : '#a8a8a8' },
            '&:hover fieldset': { borderColor: isDisabled ? '#ddd' : '#808080' },
            '&.Mui-focused fieldset': { borderColor: isDisabled ? '#ddd' : '#4285F4' },
          },
          '& .MuiOutlinedInput-input': {
            padding: '14px 10px',
            color: isDisabled ? '#999' : 'inherit'
          },
        }}
      >
        {options?.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  if (isEditMode && userLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <PageHeader
          title={isEditMode ? 'Edit User' : 'Create New Admin-User'}
          subtitle={isEditMode ? 'Update the Admin-User details' : 'Enter the details to create a new Admin-User'}
          showBackButton={true}
          showActionButton={true}
          actionButtonText={isEditMode ? 'Update Admin User' : 'Create Admin User'}
          onActionClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)}
          actionButtonDisabled={!isFormValid || loading}
        />

        <Paper sx={{
          p: 3,
          borderRadius: '10px',
          border: '1px solid #eff0f1ff',
          boxShadow: 'none',
        }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography
              variant="h6"
              fontWeight={600}
              mb={3}
              fontFamily={'var(--font-inter), sans-serif'}
            >
              User Details
            </Typography>
            {/* Fields */}
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
              {renderField('fullName', 'Full Name', 'Full Name', <PersonIcon fontSize="small" style={{ opacity: 0.7 }} />)}
              {renderField('email', 'Email Address', 'Email', <EmailIcon fontSize="small" style={{ opacity: 0.7 }} />)}
            </Box>
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
              {renderField('phoneNumber', 'Phone Number', 'Phone Number', <LocalPhoneIcon fontSize="small" style={{ opacity: 0.7 }} />)}
              {renderField('role', 'Role', 'Select Role', <AdminPanelSettingsIcon fontSize="small" style={{ opacity: 0.7 }} />, ['user', 'admin'])}
            </Box>
          </Box>
        </Paper>
      </Box>
    </DashboardLayout >
  );
};

const CreateUserPage = () => {
  return (
    <Suspense fallback={<CircularProgress />}>
      <CreateUserForm />
    </Suspense>
  );
};

export default withPageLoader(CreateUserPage);
