import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify({
  logger: true
});

fastify.register(fastifyWebsocket);

fastify.get('/hello', (request, reply) => {
    reply.send({
        message: 'Hello Fastify'
    });
});

fastify.register(async function (fastify) {
    fastify.get('/hello-ws', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {
        connection.socket.on('message', message => {
            // message.toString() === 'hi from client'
            connection.socket.send('hi from server')
        })
    })
});

fastify.listen({ port: 3000 }, (err, address) => {
    if(err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at: ${address}`);
});