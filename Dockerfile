FROM node:14.17.5-alpine3.14

RUN mkdir /he-server
WORKDIR /he-server
ADD package.json /he-server
ADD yarn.lock /he-server
ADD tsconfig.json /he-server
ADD .env /he-server
ADD src /he-server/src
RUN yarn install

CMD [ "yarn", "start" ]