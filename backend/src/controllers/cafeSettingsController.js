const CafeSettings = require('../models/CafeSettings');

const defaults = {
  name: 'Beaudesert Cafe',
  tagline: 'Cafe & Restaurant',
  address: '12 Brisbane Street, Beaudesert QLD 4285, Australia',
  phone: '+61 7 5541 2345',
  email: 'hello@beaudesertcafe.com',
  workingHours:
    'Mon–Fri: 7:00 AM – 5:00 PM\nSat–Sun: 8:00 AM – 4:00 PM',
  mapEmbedUrl:
    'https://www.google.com/maps?q=Beaudesert+QLD+Australia&output=embed',
  isTemporarilyClosed: false,
  closedFrom: null,
  closedTo: null,
  closureMessage: 'We are temporarily closed. Thank you for your patience.',
};

const ensureSettings = async () => {
  let doc = await CafeSettings.findOne();
  if (!doc) {
    doc = await CafeSettings.create(defaults);
  }
  return doc;
};

exports.getCafeSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCafeSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    const {
      name,
      tagline,
      address,
      phone,
      email,
      workingHours,
      mapEmbedUrl,
      isTemporarilyClosed,
      closedFrom,
      closedTo,
      closureMessage,
    } = req.body;

    if (!name?.trim() || !address?.trim() || !phone?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cafe name, address, phone, and email are required',
      });
    }

    settings.name = name.trim();
    if (tagline !== undefined) settings.tagline = tagline;
    settings.address = address.trim();
    settings.phone = phone.trim();
    settings.email = email.trim();
    if (workingHours !== undefined) settings.workingHours = workingHours;
    if (mapEmbedUrl !== undefined) settings.mapEmbedUrl = mapEmbedUrl;
    if (isTemporarilyClosed !== undefined) {
      settings.isTemporarilyClosed =
        isTemporarilyClosed === true || isTemporarilyClosed === 'true';
    }
    if (closedFrom !== undefined) {
      settings.closedFrom = closedFrom ? new Date(closedFrom) : null;
    }
    if (closedTo !== undefined) {
      settings.closedTo = closedTo ? new Date(closedTo) : null;
    }
    if (closureMessage !== undefined) settings.closureMessage = closureMessage;

    await settings.save();
    res.json({ success: true, data: settings, message: 'Cafe details updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
