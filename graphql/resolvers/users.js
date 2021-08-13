const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');

const {
	validateRegisterInput,
	validateLoginInput,
} = require('../../util/validators');

function generateToken(user) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			username: user.username,
		},
		process.env.JWT_SECRET,
		{ expiresIn: '7 days' },
	);
}

module.exports = {
	Mutation: {
		async register(
			_,
			{ registerInput: { username, email, password, confirmPassword } },
		) {
			//TODO: validate user data
			const { errors, valid } = validateRegisterInput(
				username,
				email,
				password,
				confirmPassword,
			);
			if (!valid) {
				throw new UserInputError('Input error', { errors });
			}
			//TODO: Make sure user doent already exist
			const user = await User.findOne({ username });
			if (user) {
				throw new UserInputError('username is taken', {
					errors: {
						username: 'This username is taken',
					},
				});
			}
			//hash password and create auth token
			password = await bcrypt.hashSync(password, 12);
			const newUser = new User({
				email,
				username,
				password,
				createdAt: new Date().toISOString(),
			});
			const result = await newUser.save();

			const token = generateToken(result);

			return { ...result._doc, id: result._id, token };
		},
		async login(_, { username, password }) {
			const { errors, valid } = validateLoginInput(username, password);
			if (!valid) {
				throw new UserInputError('Error', { errors });
			}
			const user = await User.findOne({ username });
			if (!user) {
				errors.general = 'User not found';
				throw new UserInputError('User not found', { errors });
			}
			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				errors.general = 'Invalid credentials';
				throw new UserInputError('Invalid credentials', { errors });
			}
			const token = generateToken(user);
			return {
				...user._doc,
				id: user._id,
				token,
			};
		},
	},
};
