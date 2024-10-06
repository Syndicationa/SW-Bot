const { calculateInfluence } = require("./incomeMath");

const templatePact = {
    Leader: "a",
    Participants: ["a", "b", "c"],
    Outgoing: ["w", "x", "y", "z"],
    Incoming: [],
    Cost: {join: "name"},
    Type: "NAP",
    Name: "ABC NAP",
    Defense: false,
    ID: 0
}

const PactTypes = ["MDP", "NAP"];
const Defensive = {
    MDP: true,
    NAP: false
};

const makePact = (ID, type, participants, cost, name) => {
    if (!PactTypes.some(x => x === type)) return false;
    return {
        Leader: participants[0],
        Participants: participants.slice(0,1),
        Outgoing: participants.slice(1),
        Incoming: [],
        Type: type,
        Cost: cost,
        Name: name ?? participants.join(" ") + " " + type,
        Defense: Defensive[type],
        ID
    }
}

const joinAPact = (pact, member) => {
    const newOutgoing = pact.Outgoing.filter(name => name !== member.toLowerCase());
    if (pact.Outgoing.length === newOutgoing.length) return [false, {...pact, Incoming: [...pact.Incoming, member.toLowerCase()]}];
    const newParticipants = [...pact.Participants, member.toLowerCase()];
    return [true, {...pact, Participants: newParticipants, Outgoing: newOutgoing}];
}

const addMemberToPact = (pact, member) => {
    const newIncoming = pact.Incoming.filter(name => name !== member.toLowerCase());
    if (pact.Incoming.length === newIncoming.length) return [false, {...pact, Outgoing: [...pact.Outgoing, member.toLowerCase()]}];
    const newParticipants = [...pact.Participants, member.toLowerCase()];
    return [true, {...pact, Participants: newParticipants, Incoming: newIncoming}];
}

const removeFromPact = (pact, member) => {
    const Participants = pact.Participants.filter(m => m !== member);
    const Outgoing = pact.Outgoing.filter(m => m !== member);
    const Incoming = pact.Incoming.filter(m => m !== member);
    return {...pact, Participants, Outgoing, Incoming}
}

const generateNextPactID = (pactList) => {
    const sorted = pactList.sort((a, b) => a.ID - b.ID);
    
    for (let i = 0; i < sorted.length; i++)
        if (i < sorted[i].ID) return i;
    return sorted.length;
}

const findPact = (list = [templatePact], ID) => list.find(pact => pact.ID === ID);

const calculateCost = (factions, pacts) => {
    const orderedPacts = pacts.reduce((group, pact) => group[pact.ID] = pact,[]);

    try {
        return factions.map(([name, faction]) => {
            const cost = faction.Pacts.reduce((acc, ID) => {
                const pact = orderedPacts[ID];
                return acc + pact.Cost.join*pact.Participants.length;
            });

            const newFaction = {
                ...faction,
                Usages: {
                    ...faction.Usages,
                    Influence: cost
                }
            }
        
            const {Resources, Usages, Maps} = newFaction;
        
            const influenceIncome = calculateInfluence(Resources, Usages, Maps);
            
            if (influenceIncome < 0) throw Error(name);
            return newFaction;
        })
    } catch (e) {
        return e.message;
    }
}

module.exports = {generateNextPactID, makePact, findPact, joinAPact, addMemberToPact, removeFromPact, calculateCost}