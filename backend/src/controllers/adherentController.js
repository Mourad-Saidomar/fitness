const adherentModel = require('../models/adherentModel.js');
const adherentService = require('../services/adherentService.js');


// GET all adherents
const getAllAdherents = async (req, res, next) => {
    try{
        const adherents = await adherentModel.findAll();
        res.json(adherents);
    }
    catch(err){
        next(err);
    }
};

// GET adherent by ID
const getAdherentById = async (req, res, next) => {
    try{
        const adherent = await adherentModel.findById(req.validateId);
        if (!adherent){
            return res.status(404).json({message: 'Adhérent introuvable'});
        }

        res.status(200).json(adherent);
    }
    catch(err){
       next(err);
    }
};

// POST create new adherent
const createAdherent = async (req, res, next) => {
    try{
        const result = await adherentService.createAdherent(req.body);
        return res.status(201).json(result.data);
    }
    catch(err){
       next(err);
    }
};

// PUT update adherent by ID
const updateAdherent = async (req, res, next) => {
    try{
        const result = await adherentService.updateAdherent(req.validateId, req.body);
        if(!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message : 'Adherent introuvable'});
        }

        return res.status(200).json(result.data);
    }
    catch(err){
        next(err);
    }
};

// DELETE adherent by ID
const deleteAdherent = async (req, res, next) => {
    try{
        const result = await adherentService.deleteAdherent(req.validateId);
        if(!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message: 'Adherent introuvable'});
        }

        res.status(200).json({message: 'adherent a bien été supprimé'});
    }
    catch(err){
        next(err);
    }
};

/// GET /adherents/me — Route protégée par identité
/// L'adhérent ne peut voir que SES propres informations
const getMyProfile = async (req, res, next) => {
    try{
        const adherent = await adherentModel.findByCompteId(req.user.id_compte);
        if (!adherent){
            return res.status(404).json({message: 'Profil adhérent introuvable pour ce compte'});
        }
        res.status(200).json(adherent);
    }
    catch(err){
        next(err);
    }
};

/// PUT /adherents/me — Route protégée par identité
/// L'adhérent ne peut modifier que SES propres informations
const updateMyProfile = async (req, res, next) => {
    try{
        const result = await adherentService.updateMyProfile(req.user.id_compte, req.body);
        if(!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message: 'Profil adhérent introuvable pour ce compte'});
        }

        return res.status(200).json(result.data);
    }
    catch(err){
        next(err);
    }
};

module.exports = {
  getAllAdherents,
  getAdherentById,
  createAdherent,
  updateAdherent,
  deleteAdherent,
  getMyProfile,
  updateMyProfile
};
