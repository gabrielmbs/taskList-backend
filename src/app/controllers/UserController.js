import * as Yup from 'yup';
import UserService from '../services/UserService';

const UserController = {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Falha na validação.' });
    }

    const { email: user_email } = req.body;
    const userExists = await UserService.getUserByEmail(user_email);

    if (userExists) {
      return res.status(400).json({ error: 'Usuário já cadastrado.' });
    }

    const { id, name, email } = await UserService.create(req.body);
    return res.json({ id, name, email });
  },

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) => {
          if (oldPassword) {
            return field.required();
          }
          return field;
        }),
      confirmPassword: Yup.string().when('password', (password, field) => {
        if (password) {
          return field.required().oneOf([Yup.ref('password')]);
        }
        return field;
      }),
    });

    const isValid = await schema.isValid(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Falha na validação.' });
    }

    const { email, oldPassword } = req.body;

    const userById = await UserService.getUserById(req.userId);
    const userByEmail = await UserService.getUserByEmail(email);

    const userAlreadyExists = email !== userById.email && userByEmail;
    if (userAlreadyExists) {
      return res.status(400).json({
        error: 'Já existe um usuário com esse email. Tente novamente.',
      });
    }

    const incorrectPassword =
      oldPassword && !(await userById.checkPassword(oldPassword));
    if (incorrectPassword) {
      return res.status(401).json({
        error: 'Senha incorreta. Tente novamente',
      });
    }

    const { id, name } = await userById.update(req.body);
    return res.json({ id, name, email });
  },
};

export default UserController;
