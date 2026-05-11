//import { useForm } from 'react-hook-form';
//import { zodResolver } from '@hookform/resolvers/zod';
//import { z } from 'zod';
//import { useAuthStore } from '../store/authStore';
//import { useNavigate, Link } from 'react-router-dom';

/*const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});*/

export default function Login() {
  //const { login } = useAuthStore();
  //const navigate = useNavigate();
  //const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  /*const onSubmit = async (data: any) => {
    await login(data.email, data.password);
    navigate('/projects');
  };*/

  return (
    
  <>Login</>);
}

/*
..,,,,,mmmm,mmmm<form onSubmit={handleSubmit(onSubmit)} className="...">
      <input {...register('email')} placeholder="Email" />
      <input type="password" {...register('password')} placeholder="Пароль" />
      <button type="submit">Войти</button>
      <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
    </form>
*/