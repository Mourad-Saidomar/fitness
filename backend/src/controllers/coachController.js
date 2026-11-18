const coachModel = require('../models/coachModel.js');
const coachService = require('../services/coachService.js');

// GET all coachs
const getAllCoachs = async (req, res, next) => {
    try{
        const coachs = await coachModel.getAll();
        res.json(coachs);
    }
    catch(err){
        next(err);
    }
}

// GET coach by ID
const getCoachById = async (req, res, next) => {
    try{
        const coach = await coachModel.findById(req.validateId);
        if (!coach){
            return res.status(404).json({message: 'coach introuvable'});
        }

        res.status(200).json(coach);
    }
    catch(err){
        next(err);
    }
};

// POST create new coach
const createCoach = async (req, res, next) => {
    try{
        const result = await coachService.createCoach(req.body);
        return res.status(201).json(result.data);
    }
    catch(err){
        next(err);
    }
};

// PUT update coach by ID
const updateCoach = async (req, res, next) => {
    try{
        const result = await coachService.updateCoach(req.validateId, req.body);
        if (!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message: 'Coach introuvable'});
        }

        return res.status(200).json(result.data);
    }
    catch(err){
        next(err);
    }
};

// DELETE coach by ID
const deleteCoach = async (req, res, next) => {
    try{
        const result = await coachService.deleteCoach(req.validateId);
        if (!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message: 'Coach introuvable'});
        }

        return res.status(200).json({message: 'Coach supprimé avec succès'});
    }
    catch(err){
        next(err);
    }
};

/// GET /coachs/me — Route protégée par identité
/// Le coach ne peut voir que SES propres informations
const getMyProfile = async (req, res, next) => {
    try{
        const coach = await coachModel.findByCompteId(req.user.id_compte);
        if (!coach){
            return res.status(404).json({message: 'Profil coach introuvable pour ce compte'});
        }
        res.status(200).json(coach);
    }
    catch(err){
        next(err);
    }
};

/// PUT /coachs/me — Route protégée par identité
/// Le coach ne peut modifier que SES propres informations
const updateMyProfile = async (req, res, next) => {
    try{
        const result = await coachService.updateMyProfile(req.user.id_compte, req.body);
        if (!result.success){
            if (result.error == 'INTROUVABLE') return res.status(404).json({message: 'Profil coach introuvable pour ce compte'});
        }

        return res.status(200).json(result.data);
    }
    catch(err){
        next(err);
    }
};

module.exports = {
    getAllCoachs,
    getCoachById,
    createCoach,
    updateCoach,
    deleteCoach,
    getMyProfile,
    updateMyProfile
}
