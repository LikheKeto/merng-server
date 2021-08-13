const { ApolloServer } = require('apollo-server');
const {
	ApolloServerPluginLandingPageDisabled,
	ApolloServerPluginLandingPageGraphQLPlayground,
} = require('apollo-server-core');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const mongoose = require('mongoose');

const server = new ApolloServer({
	typeDefs,
	resolvers,
	plugins: [
		process.env.NODE_ENV === 'production'
			? ApolloServerPluginLandingPageDisabled()
			: ApolloServerPluginLandingPageGraphQLPlayground(),
	],
	context: ({ req }) => ({ req }),
});

mongoose
	.connect(process.env.DB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('connected to db');
		return server.listen({ port: process.env.PORT || 5000 });
	})
	.then((result) => {
		console.log(`Server running at ${result.url}`);
	})
	.catch((err) => {
		console.error(err);
	});
