var async = require('async')

module.exports = function(playbook) {
  var p

  if (Array.isArray(playbook)) {
    p = function(context, cb) {
      async.series(playbook.map(function(directive) {
        // If the directive is a string, execute its content in our context.
        if (typeof directive === 'string') return async.apply(exec, directive, context)

        // If the directive is an object, grab its first key and require `'nibbler-' + key`.
        // This supports a syntax like: `{ apt: { pkg: 'redis-server', state: 'present' } }`
        if (typeof directive === 'object' && !Array.isArray(directive)) {
          var keys = Object.keys(directive)
          // Remark(mmalecki): Ansible seems to enjoy sticking some meta information
          // in here too (like a `name` field) - maybe filter those out?
          if (keys.length !== 1)
            throw new Error('Exactly one key is required for a directive object')

          var directiveModule = require('nibbler-' + keys[0])
          return async.apply(directiveModule, directive[keys[0]], context)
        }

        // Enable including "roles" like:
        //
        // `nginx.js`:
        //
        //      module.exports = [ [ apt, { pkg: 'nginx' } ] ]
        // 
        // `pages.js`:
        //
        //      module.exports = [ [ copy, { src: __dirname, dest: '/var/www' ] ]
        //
        //  `server.js`:
        //
        //      module.exports = [ require('./nginx.js'), require('./pages.js') ]
        //
        if (Array.isArray(directive) && Array.isArray(directive[0])) {
        }

        // If directive is anything but those (for example, a function), wrap
        // it in an array for the purpose of making it look more like a directive.
        directive = Array.isArray(directive) ? directive : [directive]
        directive.push(context)
        return async.apply.apply(null, directive)
      }), cb);
    }
  }
  else p = playbook

  return p
}
