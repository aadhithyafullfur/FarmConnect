const Purchase = require('../models/Purchase');

exports.createPurchase = async (req, res) => {
  const { productId } = req.body;
  try {
    const purchase = new Purchase({ buyerId: req.user.id, productId, purchaseDate: new Date() });
    await purchase.save();
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};