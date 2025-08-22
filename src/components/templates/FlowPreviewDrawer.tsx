import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Drawer,
    IconButton,
    Typography,
    Tooltip,
    Divider,
    useTheme,
    useMediaQuery,
    TextField,
    Button,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface FlowPreviewDrawerProps {
    nodes: any[];
    edges: any[];
    isOpen: boolean;
    onToggle: () => void;
    onUpdateNode?: (nodeId: string, updates: any) => void;
    onDeleteNode?: (nodeId: string) => void;
    onAddNode?: (afterNodeId?: string, questionData?: any) => void;
    isSplitScreen?: boolean;
    onSplitScreenToggle?: () => void;
}

// Table View Component with editable functionality
const TableView: React.FC<{
    nodes: any[];
    edges: any[];
    onUpdateNode?: (nodeId: string, updates: any) => void;
    onDeleteNode?: (nodeId: string) => void;
    onAddNode?: (afterNodeId?: string, questionData?: any) => void;
}> = ({ nodes, edges, onUpdateNode, onDeleteNode, onAddNode }) => {
    const [editingNode, setEditingNode] = useState<string | null>(null);
    const [editingOption, setEditingOption] = useState<{ nodeId: string; optionIndex: number } | null>(null);
    const [editingResponse, setEditingResponse] = useState<{ nodeId: string; optionIndex: number } | null>(null);
    const [addingQuestion, setAddingQuestion] = useState<{ afterNodeId?: string } | null>(null);
    const [editValues, setEditValues] = useState<{ question?: string; options?: string[]; responses?: string[] }>({});
    const [newQuestionData, setNewQuestionData] = useState<{
        question: string;
        questionType: string;
        options: string[];
        isRequired: boolean;
        navigation: { [optionIndex: number]: string };
    }>({
        question: '',
        questionType: 'multiple-choice',
        options: ['Option 1', 'Option 2'],
        isRequired: false,
        navigation: { 0: 'Refer to Consultant', 1: 'Refer to Consultant' }
    });

    // Force re-render when nodes or edges change to ensure dynamic updates
    useEffect(() => {
        // This effect ensures the component re-renders when data changes
    }, [nodes, edges]);

    // Helper function to get available question numbers for navigation
    const getAvailableQuestions = () => {
        const questionNumbers = [];
        for (let i = 1; i <= nodes.length + 1; i++) {
            questionNumbers.push(`Move to Q${i}`);
        }
        return [...questionNumbers, 'Refer to Consultant', 'End Survey'];
    };

    // Handle editing functions
    const startEditingQuestion = (nodeId: string, currentQuestion: string) => {
        setEditingNode(nodeId);
        setEditValues({ question: currentQuestion });
    };

    const saveQuestion = (nodeId: string) => {
        if (editValues.question && onUpdateNode) {
            onUpdateNode(nodeId, { question: editValues.question });
        }
        cancelEdit();
    };

    const startEditingOption = (nodeId: string, optionIndex: number, currentOption: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setEditingOption({ nodeId, optionIndex });
            setEditValues({ options: [...(node.data.options || [])] });
        }
    };

    const saveOption = (nodeId: string, optionIndex: number) => {
        if (editValues.options && onUpdateNode) {
            onUpdateNode(nodeId, { options: editValues.options });
        }
        setEditingOption(null);
        setEditValues({});
    };

    const cancelEdit = () => {
        setEditingNode(null);
        setEditingOption(null);
        setEditingResponse(null);
        setAddingQuestion(null);
        setEditValues({});
    };

    // Delete functions
    const deleteQuestion = (nodeId: string) => {
        if (onDeleteNode) {
            onDeleteNode(nodeId);
        }
    };

    const deleteOption = (nodeId: string, optionIndex: number) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.data?.options && onUpdateNode) {
            const newOptions = node.data.options.filter((_: any, index: number) => index !== optionIndex);
            onUpdateNode(nodeId, { options: newOptions });
        }
    };

    // Add functions
    const addOption = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node && onUpdateNode) {
            const currentOptions = node.data?.options || [];
            const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
            onUpdateNode(nodeId, { options: newOptions });
        }
    };

    const startAddingQuestion = (afterNodeId?: string) => {
        setAddingQuestion({ afterNodeId });
        const nextQuestionNumber = nodes.length + 1;
        setNewQuestionData({
            question: '',
            questionType: 'multiple-choice',
            options: ['Option 1', 'Option 2'],
            isRequired: false,
            navigation: { 0: 'Refer to Consultant', 1: 'Refer to Consultant' }
        });
    };

    const saveNewQuestion = () => {
        if (onAddNode && newQuestionData.question.trim()) {
            // Create the new question node data
            const questionData = {
                question: newQuestionData.question,
                questionType: newQuestionData.questionType,
                options: newQuestionData.options,
                isRequired: newQuestionData.isRequired
            };

            onAddNode(addingQuestion?.afterNodeId, questionData);
            setAddingQuestion(null);
            setNewQuestionData({
                question: '',
                questionType: 'multiple-choice',
                options: ['Option 1', 'Option 2'],
                isRequired: false,
                navigation: { 0: 'Refer to Consultant', 1: 'Refer to Consultant' }
            });
        }
    };

    const cancelAddQuestion = () => {
        setAddingQuestion(null);
        setNewQuestionData({
            question: '',
            questionType: 'multiple-choice',
            options: ['Option 1', 'Option 2'],
            isRequired: false,
            navigation: { 0: 'Refer to Consultant', 1: 'Refer to Consultant' }
        });
    };

    // Toggle required status
    const toggleRequired = (nodeId: string, isRequired: boolean) => {
        if (onUpdateNode) {
            onUpdateNode(nodeId, { isRequired: isRequired });
        }
    };

    // Response editing functions
    const startEditingResponse = (nodeId: string, optionIndex: number, currentResponse: string) => {
        setEditingResponse({ nodeId, optionIndex });
        const responses = [...(editValues.responses || [])];
        responses[optionIndex] = currentResponse;
        setEditValues({ ...editValues, responses });
    };

    const saveResponse = (nodeId: string, optionIndex: number) => {
        if (editValues.responses && onUpdateNode) {
            // Here you would update the edge/connection data
            // This depends on your flowchart implementation
            console.log('Saving response:', editValues.responses[optionIndex]);
        }
        setEditingResponse(null);
        setEditValues({ ...editValues, responses: undefined });
    };
    // Helper function to get option connections with improved logic
    const getOptionConnections = (nodeId: string) => {
        const connections: { [key: string]: { hasConnection: boolean; targetNumber?: number } } = {};

        // Find edges from this node
        const nodeEdges = edges.filter(edge => edge.source === nodeId);

        nodeEdges.forEach(edge => {
            const sourceHandle = edge.sourceHandle;
            const targetNode = nodes.find(n => n.id === edge.target);

            if (targetNode && sourceHandle) {
                let optionText = '';

                // Handle different source handle types
                if (sourceHandle === 'yes') {
                    optionText = 'Yes';
                } else if (sourceHandle === 'no') {
                    optionText = 'No';
                } else if (sourceHandle.startsWith('option-')) {
                    // Extract option index and get the actual option text
                    const optionIndex = parseInt(sourceHandle.replace('option-', ''));
                    const sourceNode = nodes.find(n => n.id === nodeId);
                    if (sourceNode && sourceNode.data.options && sourceNode.data.options[optionIndex]) {
                        optionText = sourceNode.data.options[optionIndex];
                    }
                } else if (sourceHandle === 'multi-all') {
                    optionText = 'All Selected';
                } else if (sourceHandle === 'text-output') {
                    optionText = 'Any Text';
                }

                // Calculate target question number based on node order in the array
                const targetNumber = nodes.findIndex(n => n.id === targetNode.id) + 1;

                if (optionText) {
                    connections[optionText] = {
                        hasConnection: true,
                        targetNumber: targetNumber
                    };
                }
            }
        });

        return connections;
    };

    return (
        <Box sx={{
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#ffffff'
        }}>
            {/* Table Header */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '50px 1fr', sm: '60px 1fr' },
                backgroundColor: '#e3f2fd',
                fontWeight: 'bold',
                fontSize: { xs: '14px', sm: '16px' },
                color: '#1976d2',
                borderBottom: '2px solid #1976d2',
                position: 'sticky',
                top: 0,
                zIndex: 1
            }}>
                <Box sx={{ padding: { xs: '12px 8px', sm: '16px' } }}>S.No</Box>
                <Box sx={{ padding: { xs: '12px 8px', sm: '16px' } }}>Question</Box>
            </Box>

            {/* Table Rows */}
            {nodes.map((node, index) => {
                const optionConnections = getOptionConnections(node.id);
                const hasOptions = ['multiple-choice', 'checkbox', 'radio', 'select', 'yes-no'].includes(node.data.questionType);

                return (
                    <Box key={node.id} sx={{
                        borderBottom: '1px solid #e1e8ed',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafe',
                    }}>
                        {/* Main Question Row */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '50px 1fr', sm: '60px 1fr' },
                            minHeight: { xs: '50px', sm: '60px' }
                        }}>
                            {/* Question Number */}
                            <Box sx={{
                                padding: { xs: '12px 8px', sm: '16px' },
                                fontWeight: 'bold',
                                fontSize: { xs: '16px', sm: '18px' },
                                color: '#2c3e50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRight: '1px solid #e1e8ed'
                            }}>
                                {index + 1}
                            </Box>

                            {/* Question Column */}
                            <Box sx={{ padding: { xs: '12px 8px', sm: '16px' } }}>
                                {editingNode === node.id ? (
                                    // Editable question
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TextField
                                            value={editValues.question || ''}
                                            onChange={(e) => setEditValues({ ...editValues, question: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    fontSize: { xs: '14px', sm: '16px' },
                                                    fontWeight: '600'
                                                }
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => saveQuestion(node.id)}
                                            sx={{ color: '#4caf50', padding: '4px' }}
                                        >
                                            <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={cancelEdit}
                                            sx={{ color: '#f44336', padding: '4px' }}
                                        >
                                            <CancelIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    // Display question with controls
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                                            {editingNode === node.id ? (
                                                // Editable question
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                    <TextField
                                                        value={editValues.question || ''}
                                                        onChange={(e) => setEditValues({ ...editValues, question: e.target.value })}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            flex: 1,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: { xs: '14px', sm: '16px' },
                                                                fontWeight: '600',
                                                                height: '40px'
                                                            }
                                                        }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => saveQuestion(node.id)}
                                                        sx={{ color: '#4caf50', padding: '4px' }}
                                                    >
                                                        <SaveIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={cancelEdit}
                                                        sx={{ color: '#f44336', padding: '4px' }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                // Display question with edit button
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                                    <Typography sx={{
                                                        fontWeight: '600',
                                                        fontSize: { xs: '14px', sm: '16px' },
                                                        color: '#2c3e50',
                                                        lineHeight: 1.4,
                                                        wordBreak: 'break-word',
                                                        flex: 1
                                                    }}>
                                                        {node.data.question || 'Untitled Question'}
                                                    </Typography>

                                                    {/* Edit Button */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => startEditingQuestion(node.id, node.data.question || '')}
                                                        sx={{
                                                            color: '#2196f3',
                                                            opacity: 0.7,
                                                            '&:hover': { opacity: 1 },
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Required Checkbox */}
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={node.data?.isRequired || false}
                                                    onChange={(e) => toggleRequired(node.id, e.target.checked)}
                                                    size="small"
                                                    sx={{ color: '#2196f3' }}
                                                />
                                            }
                                            label="Required Question"
                                            sx={{
                                                margin: 0,
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: { xs: '11px', sm: '12px' },
                                                    color: '#666'
                                                }
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Show options with S.No and responses inline */}
                                {hasOptions && (
                                    <Box sx={{ marginTop: '12px' }}>
                                        {node.data.questionType === 'yes-no' ? (
                                            // For yes-no questions, show Yes and No options with responses
                                            ['Yes', 'No'].map((option: string, optIndex: number) => {
                                                const connection = optionConnections[option];
                                                let responseText = 'Refer to Consultant';
                                                
                                                if (connection && connection.hasConnection && connection.targetNumber) {
                                                    responseText = `Move to Q${connection.targetNumber}`;
                                                }
                                                
                                                return (
                                                    <Box key={optIndex} sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        fontSize: { xs: '12px', sm: '14px' },
                                                        color: '#333',
                                                        gap: 1
                                                    }}>
                                                        {/* Option Text - Left Side */}
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            flex: 1,
                                                            wordBreak: 'break-word',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <Box sx={{
                                                                minWidth: { xs: '16px', sm: '20px' },
                                                                fontWeight: 'bold',
                                                                marginRight: { xs: '4px', sm: '8px' },
                                                                fontSize: { xs: '11px', sm: '14px' }
                                                            }}>
                                                                {optIndex + 1}.
                                                            </Box>
                                                            <Box sx={{ flex: 1 }}>{option}</Box>
                                                        </Box>
                                                        {/* Navigation - Right Side */}
                                                        <Box sx={{
                                                            fontWeight: '500',
                                                            color: responseText.includes('Move to') ? '#2196f3' : '#ff5722',
                                                            fontSize: { xs: '11px', sm: '14px' },
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                            textAlign: 'right'
                                                        }}>
                                                            {responseText}
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            // For other question types with options and responses
                                            node.data.options?.map((option: string, optIndex: number) => {
                                                const connection = optionConnections[option];
                                                let responseText = 'Refer to Consultant';
                                                
                                                if (connection && connection.hasConnection && connection.targetNumber) {
                                                    responseText = `Move to Q${connection.targetNumber}`;
                                                }
                                                
                                                return (
                                                    <Box key={optIndex} sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        fontSize: { xs: '12px', sm: '14px' },
                                                        color: '#333',
                                                        gap: 1
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                            {editingOption?.nodeId === node.id && editingOption?.optionIndex === optIndex ? (
                                                                // Editable option
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                                                    <Box sx={{
                                                                        minWidth: { xs: '16px', sm: '20px' },
                                                                        fontWeight: 'bold',
                                                                        marginRight: { xs: '4px', sm: '8px' },
                                                                        fontSize: { xs: '11px', sm: '14px' }
                                                                    }}>
                                                                        {optIndex + 1}.
                                                                    </Box>
                                                                    <TextField
                                                                        value={editValues.options?.[optIndex] || ''}
                                                                        onChange={(e) => {
                                                                            const newOptions = [...(editValues.options || [])];
                                                                            newOptions[optIndex] = e.target.value;
                                                                            setEditValues({ ...editValues, options: newOptions });
                                                                        }}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        sx={{
                                                                            flex: 1,
                                                                            '& .MuiOutlinedInput-root': {
                                                                                fontSize: { xs: '12px', sm: '14px' },
                                                                                height: '32px'
                                                                            }
                                                                        }}
                                                                    />
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => saveOption(node.id, optIndex)}
                                                                        sx={{ color: '#4caf50', padding: '2px' }}
                                                                    >
                                                                        <SaveIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={cancelEdit}
                                                                        sx={{ color: '#f44336', padding: '2px' }}
                                                                    >
                                                                        <CancelIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            ) : (
                                                                // Display option with edit button at start
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    flex: 1,
                                                                    wordBreak: 'break-word',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => startEditingOption(node.id, optIndex, option)}
                                                                        sx={{
                                                                            color: '#2196f3',
                                                                            opacity: 0.7,
                                                                            '&:hover': { opacity: 1 },
                                                                            padding: '2px'
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => deleteOption(node.id, optIndex)}
                                                                        sx={{
                                                                            color: '#f44336',
                                                                            opacity: 0.7,
                                                                            '&:hover': { opacity: 1 },
                                                                            padding: '2px'
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <Box sx={{
                                                                        minWidth: { xs: '16px', sm: '20px' },
                                                                        fontWeight: 'bold',
                                                                        marginRight: { xs: '4px', sm: '8px' },
                                                                        fontSize: { xs: '11px', sm: '14px' }
                                                                    }}>
                                                                        {optIndex + 1}.
                                                                    </Box>
                                                                    <Box sx={{ flex: 1 }}>{option}</Box>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        {/* Navigation - Right Side */}
                                                        <Box sx={{
                                                            fontWeight: '500',
                                                            color: responseText.includes('Move to') ? '#2196f3' : '#ff5722',
                                                            fontSize: { xs: '11px', sm: '14px' },
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                            textAlign: 'right'
                                                        }}>
                                                            {responseText}
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        )}

                                        {/* Add Option Button */}
                                        <Box sx={{ marginTop: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => addOption(node.id)}
                                                sx={{
                                                    color: '#63b5f7',
                                                    backgroundColor: '#f0f8ff',
                                                    '&:hover': { backgroundColor: '#e6f3ff' },
                                                    padding: '4px'
                                                }}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                            <Typography sx={{
                                                fontSize: { xs: '11px', sm: '12px' },
                                                color: '#63b5f7',
                                                fontWeight: '500'
                                            }}>
                                                Add Option
                                            </Typography>
                                        </Box>

                                    </Box>
                                )}
                                
                                {/* Show Text Input for questions without options */}
                                {!hasOptions && (
                                    <Box sx={{
                                        marginTop: { xs: '8px', sm: '12px' },
                                        padding: { xs: '6px 10px', sm: '8px 14px' },
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        fontSize: { xs: '12px', sm: '14px' },
                                        fontWeight: '500',
                                        color: '#6c757d',
                                        border: '1px solid #dee2e6',
                                        display: 'inline-block'
                                    }}>
                                        Text Input
                                    </Box>
                                )}
                            </Box>
                        </Box>



                        {/* Inline Question Creation Form */}
                        {addingQuestion?.afterNodeId === node.id && (
                            <Box sx={{
                                borderBottom: '1px solid #e1e8ed',
                                backgroundColor: '#f8fafe',
                                padding: 2,
                                margin: '8px 0'
                            }}>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '50px 1fr', sm: '60px 1fr' },
                                    minHeight: { xs: '50px', sm: '60px' }
                                }}>
                                    {/* Question Number */}
                                    <Box sx={{
                                        padding: { xs: '12px 8px', sm: '16px' },
                                        fontWeight: 'bold',
                                        fontSize: { xs: '16px', sm: '18px' },
                                        color: '#1976d2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRight: '1px solid #e1e8ed'
                                    }}>
                                        {nodes.findIndex(n => n.id === node.id) + 2}
                                    </Box>

                                    {/* Question Form */}
                                    <Box sx={{ padding: { xs: '12px 8px', sm: '16px' } }}>
                                        <Box sx={{ marginBottom: 2 }}>
                                            <TextField
                                                value={newQuestionData.question}
                                                onChange={(e) => setNewQuestionData({ ...newQuestionData, question: e.target.value })}
                                                placeholder="Enter your question..."
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        fontSize: { xs: '14px', sm: '16px' },
                                                        fontWeight: '600'
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Required Checkbox */}
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={newQuestionData.isRequired}
                                                    onChange={(e) => setNewQuestionData({ ...newQuestionData, isRequired: e.target.checked })}
                                                    size="small"
                                                    sx={{ color: '#2196f3' }}
                                                />
                                            }
                                            label="Required Question"
                                            sx={{
                                                margin: 0,
                                                marginBottom: 2,
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: { xs: '11px', sm: '12px' },
                                                    color: '#666'
                                                }
                                            }}
                                        />

                                        {/* Options with Navigation */}
                                        <Typography sx={{ fontSize: '12px', color: '#666', marginBottom: 1 }}>
                                            Configure options and their navigation paths:
                                        </Typography>
                                        <Box sx={{ marginBottom: 2 }}>
                                            {newQuestionData.options.map((option, optIndex) => (
                                                <Box key={optIndex} sx={{ marginBottom: 2, padding: 1, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                                    {/* Option Text */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                                                        <Typography sx={{ minWidth: '20px', fontWeight: 'bold' }}>
                                                            {optIndex + 1}.
                                                        </Typography>
                                                        <TextField
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...newQuestionData.options];
                                                                newOptions[optIndex] = e.target.value;
                                                                setNewQuestionData({ ...newQuestionData, options: newOptions });
                                                            }}
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ flex: 1 }}
                                                            placeholder="Enter option text"
                                                        />
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                const newOptions = newQuestionData.options.filter((_, i) => i !== optIndex);
                                                                const newNavigation = { ...newQuestionData.navigation };
                                                                delete newNavigation[optIndex];
                                                                // Reindex navigation
                                                                const reindexedNavigation: { [key: number]: string } = {};
                                                                Object.keys(newNavigation).forEach((key, index) => {
                                                                    const keyNum = parseInt(key);
                                                                    if (keyNum > optIndex) {
                                                                        reindexedNavigation[keyNum - 1] = newNavigation[keyNum];
                                                                    } else if (keyNum < optIndex) {
                                                                        reindexedNavigation[keyNum] = newNavigation[keyNum];
                                                                    }
                                                                });
                                                                setNewQuestionData({
                                                                    ...newQuestionData,
                                                                    options: newOptions,
                                                                    navigation: reindexedNavigation
                                                                });
                                                            }}
                                                            sx={{ color: '#f44336' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>

                                                    {/* Navigation Selection */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: '24px' }}>
                                                        <Typography sx={{ fontSize: '12px', color: '#666', minWidth: '60px' }}>
                                                            Navigate to:
                                                        </Typography>
                                                        <TextField
                                                            value={newQuestionData.navigation[optIndex] || 'Refer to Consultant'}
                                                            onChange={(e) => {
                                                                const newNavigation = { ...newQuestionData.navigation };
                                                                newNavigation[optIndex] = e.target.value;
                                                                setNewQuestionData({ ...newQuestionData, navigation: newNavigation });
                                                            }}
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{
                                                                flex: 1,
                                                                '& .MuiOutlinedInput-root': {
                                                                    fontSize: '12px',
                                                                    height: '32px'
                                                                }
                                                            }}
                                                            placeholder="e.g., Move to Q3, Refer to Consultant"
                                                        />
                                                    </Box>
                                                </Box>
                                            ))}

                                            {/* Add Option Button */}
                                            <Button
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={() => {
                                                    const newOptions = [...newQuestionData.options, `Option ${newQuestionData.options.length + 1}`];
                                                    const newNavigation = { ...newQuestionData.navigation };
                                                    newNavigation[newOptions.length - 1] = 'Refer to Consultant';
                                                    setNewQuestionData({ ...newQuestionData, options: newOptions, navigation: newNavigation });
                                                }}
                                                sx={{ color: '#63b5f7', fontSize: '12px' }}
                                            >
                                                Add Option
                                            </Button>
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={saveNewQuestion}
                                                disabled={!newQuestionData.question.trim()}
                                                sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#45a049' } }}
                                            >
                                                Save Question
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={cancelAddQuestion}
                                                sx={{ color: '#f44336', borderColor: '#f44336' }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

const FlowPreviewDrawer: React.FC<FlowPreviewDrawerProps> = ({
    nodes,
    edges,
    isOpen,
    onToggle,
    onUpdateNode,
    onDeleteNode,
    onAddNode,
    isSplitScreen = false,
    onSplitScreenToggle
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    // Responsive drawer width
    const getDrawerWidth = () => {
        if (isMobile) return Math.min(window.innerWidth * 0.9, 350);
        if (isTablet) return Math.min(window.innerWidth * 0.4, 450);
        return 400;
    };

    const [drawerWidth, setDrawerWidth] = useState(getDrawerWidth());
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Update drawer width on screen size change
    useEffect(() => {
        const handleResize = () => {
            if (!isResizing) {
                setDrawerWidth(getDrawerWidth());
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isTablet, isResizing]);

    // Handle drag resize for mouse
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startWidth = drawerWidth;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const deltaX = startX - e.clientX;
            const newWidth = Math.max(250, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
            setDrawerWidth(newWidth);
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        // Set cursor and disable text selection during drag
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [drawerWidth]);

    // Handle drag resize for touch
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.touches[0].clientX;
        const startWidth = drawerWidth;

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const deltaX = startX - e.touches[0].clientX;
            const newWidth = Math.max(250, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
            setDrawerWidth(newWidth);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            setIsResizing(false);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.body.style.userSelect = 'auto';
        };

        // Disable text selection during drag
        document.body.style.userSelect = 'none';

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }, [drawerWidth]);

    // Split screen mode - render as fixed positioned element
    if (isSplitScreen && isOpen) {
        return (
            <Box sx={{
                position: 'fixed',
                right: 0,
                top: '70px',
                width: '50%',
                height: 'calc(100vh - 70px)',
                backgroundColor: '#ffffff',
                borderLeft: '1px solid #e0e0e0',
                zIndex: 1000,
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{
                    padding: { xs: '8px 12px', sm: '12px 16px' },
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Typography variant="h6" sx={{
                        fontSize: { xs: '16px', sm: '18px' },
                        fontWeight: 'bold',
                        color: '#1976d2'
                    }}>
                        Live Preview
                    </Typography>
                </Box>

                {/* Content */}
                <Box sx={{
                    height: 'calc(100% - 60px)',
                    overflow: 'auto',
                    padding: { xs: '8px', sm: '12px' }
                }}>
                    <TableView
                        nodes={nodes}
                        edges={edges}
                        onUpdateNode={onUpdateNode}
                        onDeleteNode={onDeleteNode}
                        onAddNode={onAddNode}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <>
            {/* Toggle Button - Only show when not in split screen mode */}
            {!isSplitScreen && (
                <Box sx={{
                    position: 'fixed',
                    right: isOpen ? drawerWidth : 0,
                    top: 'calc(70px + 50vh - 30px)', // Position below header (70px) + center of remaining space
                    zIndex: 1300,
                    transition: isResizing ? 'none' : 'right 0.3s ease'
                }}>
                    <Tooltip title={isOpen ? "Hide Preview" : "Show Preview"} placement="left">
                        <IconButton
                            onClick={onToggle}
                            sx={{
                                backgroundColor: '#2196f3',
                                color: 'white',
                                borderRadius: '8px 0 0 8px',
                                width: '40px',
                                height: '60px',
                                '&:hover': {
                                    backgroundColor: '#1976d2'
                                },
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            {isOpen ? <ChevronRightIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Drawer */}
            <Drawer
                anchor="right"
                open={isOpen}
                variant="persistent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                        borderLeft: '1px solid #e0e0e0',
                        zIndex: 1200,
                        transition: isResizing ? 'none' : 'width 0.3s ease',
                        top: '70px', // Start below header
                        height: 'calc(100vh - 70px)' // Adjust height to account for header
                    },
                }}
            >
                {/* Resize Handle */}
                <Box
                    ref={resizeRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '8px',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1300,
                        '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.15)',
                            '& .resize-indicator': {
                                backgroundColor: '#2196f3',
                                width: '3px'
                            }
                        },
                        '&:active': {
                            backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        },
                        ...(isResizing && {
                            backgroundColor: 'rgba(33, 150, 243, 0.25)',
                            '& .resize-indicator': {
                                backgroundColor: '#1976d2',
                                width: '4px'
                            }
                        }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                    }}
                >
                    <Box
                        className="resize-indicator"
                        sx={{
                            width: '2px',
                            height: '60px',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '1px',
                            transition: 'all 0.2s ease',
                            pointerEvents: 'none'
                        }}
                    />
                </Box>

                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    paddingLeft: '24px' // Account for resize handle
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            Live Preview
                        </Typography>
                        {!isMobile && (
                            <Tooltip title="Drag to resize" placement="top">
                                <DragIndicatorIcon sx={{ color: '#999', fontSize: 16 }} />
                            </Tooltip>
                        )}
                    </Box>
                    <IconButton onClick={onToggle} size="small">
                        <ChevronRightIcon />
                    </IconButton>
                </Box>

                <Divider />

                {/* Content */}
                <Box sx={{
                    height: 'calc(100vh - 70px - 73px)', // Account for header (70px) and drawer header (73px)
                    overflow: 'hidden',
                    paddingLeft: '8px' // Account for resize handle
                }}>
                    {nodes.length > 0 ? (
                        <TableView
                            nodes={nodes}
                            edges={edges}
                            onUpdateNode={onUpdateNode}
                            onDeleteNode={onDeleteNode}
                            onAddNode={onAddNode}
                        />
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#666',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            <VisibilityIcon sx={{ fontSize: 48, marginBottom: 2, opacity: 0.5 }} />
                            <Typography variant="h6" sx={{ marginBottom: 1 }}>
                                No Questions Yet
                            </Typography>
                            <Typography variant="body2">
                                Add questions to see the live preview
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Drawer>
        </>
    );
};

export default FlowPreviewDrawer;
