# Theia CLI

`theia` is a command line wrapper around tools used to create, build and run Theia applications.

## Commands

- `theia clean` - remove the built output (`lib` folder)
- `theia copy` - copies static resources to the built ouput
- `theia build` - packages the frontend code with webpack
    - arguments passed to webpack, e.g. `theia build --watch` to package the frontned code incrementally
- `theia browser` - start the backend node process
    - by default on port `3000`
    - arguments passed to node process, e.g. `theia browser --port=3001` to start the backend on port `3001`
- `theia electron` - start the backend electron process
    - by default on port `localhost`
    - arguments passed to electron process, e.g. `theia electron --host=myhost` to start the backend on host `myhost`
