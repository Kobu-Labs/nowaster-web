# Nowaster

Simple application for tracking your time

## Deployment

The application, both backend and frontend are fully dockerized. Furthermore, we provide a docker-compose file for easy deployment in `deploy/docker-compose.yaml`.
To run the application, first provide the necessary environment variables in a `.env` file in the located at `deploy/.env`. You can copy the `.env-template` file and fill in the necessary values.
After filling in the necessary values, you need to copy the *FRONTEND* section of the `.env` file to `next-frontend/.env`. This is a limitation of nextjs and the way it handles environment variables.

There is also `deploy/.env-example` file that can be used as a reference for a typical, locally run setup. However, don't forget to copy the *FRONTEND* section to `next-frontend/.env` file.

After setting up the environment variables, you can run the application by running the following command in the `deploy` directory:

```bash
docker compose up
```

or

```bash
docker compose up -d
```

## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).
