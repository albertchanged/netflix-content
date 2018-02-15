# Use an official Node runtime as a parent image
FROM node:carbon

# Set the working directory to /app
WORKDIR /app

# Copy contents of app
COPY . .

# Install any needed packages
RUN npm install

# Make port 4000 available to the world outside this container
EXPOSE 4000

# Run server when the container launches
CMD ["npm", "start"]