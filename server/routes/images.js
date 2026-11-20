/* Images are stored inside MongoDB (compressed in the browser); served only to logged-in users */
module.exports = (app, { D, h }) => {
  app.get('/api/img/:id', h(async (req, res) => {
    const d = await D.images.findOne({ _id: req.params.id }); if (!d) return res.status(404).end();
    const m = d.data.match(/^data:(image\/[\w+.-]+);base64,(.*)$/); if (!m) return res.status(404).end();
    res.set('Content-Type', m[1]).set('Cache-Control', 'private, max-age=31536000').send(Buffer.from(m[2], 'base64'));
  }));
};
