module.exports = {
  apps : [{
    name        : "nsm:watch",
    script      : "yarn run watch",
    watch       : false,
    instances: 1,
    env: {
      "NODE_ENV": "development",
      "DEBUG": ""
    }
  }]
};
