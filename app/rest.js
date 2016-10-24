'use strict'

module.exports = function(app, redisClient) {
  return {
    searchProgram: (req, res) => {
      console.log(req.params.program);
      return redisClient.hgetAsync(
        'programs',
        req.params.program
      ).then((packages) => {
        console.log('0', packages);
        return Promise.all(JSON.parse(packages).map((pkg) => {
          console.log('1', pkg);
          return redisClient.hgetAsync(
            pkg.distro + ':packages',
            req.params.program);
        })).then((packages) => {
          console.log('2', packages);
          return res.json(packages.map(JSON.parse));
        });
      }).catch((e) => {
        return res.json({ 'error': e, });
      });
    },

    searchDistroPackage: (req, res) => {
      console.log(req.params.program, 'a');
      return redisClient.hgetAsync(
        'programs',
        req.params.program
      ).then((packages) => {
        if (packages) {
          return Promise.all(JSON.parse(packages)
            .filter((pkg) =>  pkg.distro == req.params.distro )
              .map((pkg) => {
                return redisClient.hgetAsync(
                  pkg.distro + ':packages',
                  req.params.program);
              })).then((packages) => {
                console.log('a', packages);
                return res.json(packages.map(JSON.parse));
              });
        } else {
          res.status(404);
          return res.json("not found");
        }
      }).catch((e,ee) => {
        console.log('e', e, ee);
        return res.json({ 'error': ee, });
      });
    },

    setDistroPackage: (req, res) => {
      try {
        console.log('0', req.body, req.body.last_updated);
        var obj = {};
        if (req.body.website) {
          obj['website'] = req.body.website;
        }
        if (req.body.install_command) {
          obj['install_command'] = req.body.install_command;
        }
        if (req.body.last_updated !== undefined &&
          req.body.last_updated !== null) {
            obj['last_updated'] = req.body.last_updated;
          }
        if (req.body.caveats) {
          obj['caveats'] = req.body.caveats;
        }
        console.log('1');
        if (Object.keys(obj).length > 0) {
          console.log('2');
          return redisClient.hsetAsync(
            req.params.distro + ':packages',
            req.params.program,
            JSON.stringify(obj)
          ).then(() => {
            return redisClient.hgetAsync(
              'programs',
              req.params.program).then((programs) => {
                if (programs instanceof Array) {
                  console.log(programs)
                  present = programs.
                    filter((p) => p.distro == req.params.distro).
                    length > 0;
                  if (present) {
                    return res.json(obj);
                  }
                } else {
                  programs = [];
                }

                programs.push({
                  distro: req.params.distro,
                  'package': req.params.program
                });
                return redisClient.hsetAsync(
                  'programs',
                  req.params.program,
                  JSON.stringify(programs)
                ).then(() => {
                  console.log('hey', 
                  JSON.stringify(programs), req.params.program);
                  return res.json(obj);
                });
              });
          }).catch((e) => { throw e });
        } else {
          console.log('3');
          throw 'No correct fields were sent';
        }
      } catch(s) {
        console.log(s);
        console.log('4');
        res.status(400)
        return res.json({'error': s });
      }
    },

    removeDistroPackage: (req, res) => {
      return redisClient.hdelAsync(
        req.params.distro + ':packages',
        req.params.program
      ).then((status) => {
        return res.json("ok");
      }).catch((e) => {
        return res.json({ 'error': e, });
      });
    },

    updateDistroPackage: (req, res) => {
      return redisClient.hgetAsync(
        req.params.distro + ':packages',
        req.params.program
      ).then((obj) => {
        try {
          obj = JSON.parse(obj);
        } catch (e) {
          return res.json({error: e});
        }
        var fields = [{name: 'website', type: String},
          {name: 'install_command', type: String},
          {name: 'last_updated', type: Number},
          {name: 'caveats', type: Array},]
        for (var i = 0; i < fields.length; ++i) {
          if (req.body[fields[i].name] !== null &&
            req.body[fields[i].name] !== undefined) {
              if (req.body[fields[i].name].constructor === fields[i].type) {
                obj[fields[i].name] = req.body[fields[i].name];
              } else {
                res.status(400);
                return res.json({'error': 'bad type for ' + fields[i].name})
              }

            }
        }
        return res.json("ok");
      }).catch((e, ee) => {
        console.log(e,ee);
        return res.json({ 'error': e, });
      });
    },
  }
}
